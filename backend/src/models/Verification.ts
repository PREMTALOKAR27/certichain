import { Schema, model } from "mongoose";

export type VerificationResult = "VALID" | "TAMPERED" | "REVOKED" | "NOT_FOUND";

export interface VerificationRecord {
  certificateId: string;
  verifiedAt: Date;
  result: VerificationResult;
}

const verificationSchema = new Schema<VerificationRecord>(
  {
    certificateId: { type: String, required: true, index: true },
    verifiedAt: { type: Date, required: true, default: Date.now },
    result: {
      type: String,
      enum: ["VALID", "TAMPERED", "REVOKED", "NOT_FOUND"],
      required: true,
    },
  },
  { timestamps: false },
);

export const Verification = model<VerificationRecord>(
  "Verification",
  verificationSchema,
);
