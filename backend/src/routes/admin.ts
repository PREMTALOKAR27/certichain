import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { asyncHandler } from "../middleware/errors";
import { Certificate } from "../models/Certificate";
import { Verification } from "../models/Verification";

const router = Router();

router.get(
  "/dashboard/stats",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const [total, active, revoked, totalVerifications] = await Promise.all([
      Certificate.countDocuments({ status: { $in: ["ACTIVE", "REVOKED"] } }),
      Certificate.countDocuments({ status: "ACTIVE" }),
      Certificate.countDocuments({ status: "REVOKED" }),
      Verification.countDocuments(),
    ]);
    res.json({
      totalCertificates: total,
      activeCertificates: active,
      revokedCertificates: revoked,
      totalVerifications,
    });
  }),
);

router.get(
  "/verifications",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const verifications = await Verification.find()
      .sort({ verifiedAt: -1 })
      .limit(limit)
      .lean();
    res.json({ verifications });
  }),
);

export default router;
