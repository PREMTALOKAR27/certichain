import { Schema, Types, model } from "mongoose";

export type CertificateStatus = "PENDING" | "ACTIVE" | "REVOKED" | "FAILED";

export interface CertificateRecord {
  certificateId: string;
  studentName: string;
  rollNumber: string;
  course: string;
  department: string;
  institution: string;
  academicYear: string;
  certificateType: string;
  issueDate: Date;
  issuerName: string;
  certificateHash: string;
  pdfPath?: string;
  blockchainTxHash?: string;
  blockNumber?: number;
  blockTimestamp?: Date;
  revocationTxHash?: string;
  revocationBlockNumber?: number;
  revocationTimestamp?: Date;
  issuerWallet: string;
  studentUserId?: Types.ObjectId;
  status: CertificateStatus;
}

const certificateSchema = new Schema<CertificateRecord>(
  {
    certificateId: { type: String, required: true, unique: true, index: true },
    studentName: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    certificateType: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true },
    issuerName: { type: String, required: true, trim: true },
    certificateHash: { type: String, required: true },
    pdfPath: { type: String },
    blockchainTxHash: { type: String },
    blockNumber: { type: Number },
    blockTimestamp: { type: Date },
    revocationTxHash: { type: String },
    revocationBlockNumber: { type: Number },
    revocationTimestamp: { type: Date },
    issuerWallet: { type: String, required: true },
    studentUserId: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REVOKED", "FAILED"],
      required: true,
      default: "PENDING",
    },
  },
  { timestamps: true },
);

certificateSchema.index({ studentUserId: 1, createdAt: -1 });

export const Certificate = model<CertificateRecord>(
  "Certificate",
  certificateSchema,
);
