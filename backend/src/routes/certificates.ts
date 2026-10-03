import { Router } from "express";
import { HydratedDocument, Types } from "mongoose";
import { authenticate, requireRole } from "../middleware/auth";
import { asyncHandler } from "../middleware/errors";
import { Certificate, CertificateRecord } from "../models/Certificate";
import { CertificateCounter } from "../models/Counter";
import { User } from "../models/User";
import { Verification, VerificationResult } from "../models/Verification";
import { hashCertificate } from "../services/certificateHash";
import {
  createCertificatePdf,
  createQrDataUrl,
  verificationUrl,
} from "../services/certificateDocument";
import {
  getIssuerWalletAddress,
  issueOnChain,
  revokeOnChain,
  verifyOnChain,
} from "../services/blockchain";

const router = Router();
const requiredCertificateFields = [
  "studentName",
  "rollNumber",
  "course",
  "department",
  "institution",
  "academicYear",
  "certificateType",
] as const;
const hashableTextFields = [
  ...requiredCertificateFields,
  "issuerName",
] as const;

function certificateDetails(
  certificate: Pick<
    CertificateRecord,
    | "certificateId"
    | "studentName"
    | "rollNumber"
    | "course"
    | "department"
    | "institution"
    | "academicYear"
    | "certificateType"
    | "issueDate"
    | "issuerName"
  >,
) {
  return {
    certificateId: certificate.certificateId,
    studentName: certificate.studentName,
    rollNumber: certificate.rollNumber,
    course: certificate.course,
    department: certificate.department,
    institution: certificate.institution,
    academicYear: certificate.academicYear,
    certificateType: certificate.certificateType,
    issueDate: certificate.issueDate,
    issuerName: certificate.issuerName,
  };
}

function canRead(certificate: CertificateRecord, userId: string, role: string) {
  return role === "ADMIN" || certificate.studentUserId?.toString() === userId;
}

async function verifyAndLog(
  certificateId: string,
  certificate: HydratedDocument<CertificateRecord> | null,
) {
  if (
    !certificate ||
    certificate.status === "PENDING" ||
    certificate.status === "FAILED"
  ) {
    await Verification.create({ certificateId, result: "NOT_FOUND" });
    return { result: "NOT_FOUND" as VerificationResult };
  }

  const details = { ...certificateDetails(certificate) };
  for (const field of hashableTextFields)
    details[field] = details[field].trim();

  const submittedHash = hashCertificate(details);
  const chain = await verifyOnChain(certificateId, submittedHash);
  let result: VerificationResult;
  if (!chain.exists) result = "NOT_FOUND";
  else if (chain.revoked) result = "REVOKED";
  else if (!chain.hashMatches) result = "TAMPERED";
  else result = "VALID";

  if (chain.revoked && certificate.status !== "REVOKED") {
    certificate.status = "REVOKED";
    await certificate.save();
  }
  await Verification.create({ certificateId, result });

  return {
    result,
    certificate: certificateDetails(certificate),
    originalHash: chain.certificateHash || certificate.certificateHash,
    submittedHash,
    blockchain: {
      ...chain,
      hash: chain.certificateHash || "",
      transactionHash: certificate.blockchainTxHash,
      blockNumber: certificate.blockNumber,
      revocationTransactionHash: certificate.revocationTxHash,
      revocationBlockNumber: certificate.revocationBlockNumber,
      issuer: certificate.issuerWallet,
    },
  };
}

export const publicVerifyHandler = asyncHandler(async (req, res) => {
  const certificateId = req.params.certificateId;
  const certificate = await Certificate.findOne({ certificateId });
  res.json(await verifyAndLog(certificateId, certificate));
});

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const filter =
      req.auth!.role === "ADMIN"
        ? {}
        : { studentUserId: new Types.ObjectId(req.auth!.userId) };
    const certificates = await Certificate.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    res.json({ certificates });
  }),
);

router.get(
  "/:id/qr",
  authenticate,
  asyncHandler(async (req, res) => {
    const certificate = await Certificate.findOne({
      certificateId: req.params.id,
    });
    if (!certificate) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    if (!canRead(certificate, req.auth!.userId, req.auth!.role)) {
      res.status(403).json({ error: "You cannot access this certificate" });
      return;
    }
    res.json({
      qrCode: await createQrDataUrl(certificate.certificateId),
      verificationUrl: verificationUrl(certificate.certificateId),
    });
  }),
);

router.get(
  "/:id/download",
  authenticate,
  asyncHandler(async (req, res) => {
    const certificate = await Certificate.findOne({
      certificateId: req.params.id,
    });
    if (!certificate) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    if (!canRead(certificate, req.auth!.userId, req.auth!.role)) {
      res.status(403).json({ error: "You cannot access this certificate" });
      return;
    }
    const pdf = await createCertificatePdf(certificate);
    res
      .type("application/pdf")
      .attachment(`${certificate.certificateId}.pdf`)
      .send(pdf);
  }),
);

router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const missing = requiredCertificateFields.filter(
      (field) => typeof body[field] !== "string" || !body[field].trim(),
    );
    if (missing.length) {
      res.status(400).json({
        error: "Required certificate fields are missing",
        fields: missing,
      });
      return;
    }

    const now = new Date();
    const counter = await CertificateCounter.findOneAndUpdate(
      { year: now.getUTCFullYear() },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const certificateId = `CERT-${now.getUTCFullYear()}-${String(counter.sequence).padStart(5, "0")}`;
    const admin = await User.findById(req.auth!.userId);
    if (!admin) {
      res.status(401).json({ error: "Administrator account no longer exists" });
      return;
    }

    let studentUserId: Types.ObjectId | undefined;
    if (typeof body.studentEmail === "string" && body.studentEmail.trim()) {
      const student = await User.findOne({
        email: body.studentEmail.trim().toLowerCase(),
        role: "STUDENT",
      });
      if (!student) {
        res
          .status(400)
          .json({ error: "No student account exists for studentEmail" });
        return;
      }
      studentUserId = student._id;
    }

    const details = {
      certificateId,
      studentName: body.studentName.trim(),
      rollNumber: body.rollNumber.trim(),
      course: body.course.trim(),
      department: body.department.trim(),
      institution: body.institution.trim(),
      academicYear: body.academicYear.trim(),
      certificateType: body.certificateType.trim(),
      issueDate: now,
      issuerName: admin.name,
    };
    const issuerWallet = await getIssuerWalletAddress();
    const certificate = await Certificate.create({
      ...details,
      certificateHash: hashCertificate(details),
      issuerWallet,
      studentUserId,
      status: "PENDING",
    });

    let transaction: Awaited<ReturnType<typeof issueOnChain>>;
    try {
      transaction = await issueOnChain(
        certificateId,
        certificate.certificateHash,
        now,
      );
    } catch (error) {
      certificate.status = "FAILED";
      await certificate.save();
      throw error;
    }

    certificate.status = "ACTIVE";
    certificate.blockchainTxHash = transaction.transactionHash;
    certificate.blockNumber = transaction.blockNumber;
    certificate.blockTimestamp = transaction.blockTimestamp;
    await certificate.save();
    res.status(201).json({ certificate });
  }),
);

router.get(
  "/:id/verify",
  authenticate,
  asyncHandler(async (req, res) => {
    const certificate = await Certificate.findOne({
      certificateId: req.params.id,
    });
    if (
      certificate &&
      !canRead(certificate, req.auth!.userId, req.auth!.role)
    ) {
      res.status(403).json({ error: "You cannot access this certificate" });
      return;
    }
    res.json(await verifyAndLog(req.params.id, certificate));
  }),
);

router.patch(
  "/:id/revoke",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const certificate = await Certificate.findOne({
      certificateId: req.params.id,
    });
    if (!certificate) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    if (certificate.status === "REVOKED") {
      res.status(409).json({ error: "Certificate is already revoked" });
      return;
    }
    if (certificate.status !== "ACTIVE") {
      res
        .status(409)
        .json({ error: "Only active certificates can be revoked" });
      return;
    }

    const transaction = await revokeOnChain(certificate.certificateId);
    certificate.status = "REVOKED";
    certificate.revocationTxHash = transaction.transactionHash;
    certificate.revocationBlockNumber = transaction.blockNumber;
    certificate.revocationTimestamp = transaction.blockTimestamp;
    await certificate.save();
    res.json({ certificate });
  }),
);

router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const certificate = await Certificate.findOne({
      certificateId: req.params.id,
    });
    if (!certificate) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }
    if (!canRead(certificate, req.auth!.userId, req.auth!.role)) {
      res.status(403).json({ error: "You cannot access this certificate" });
      return;
    }
    res.json({ certificate });
  }),
);

export default router;
