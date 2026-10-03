import { Schema, model } from "mongoose";

const counterSchema = new Schema({
  year: { type: Number, required: true, unique: true },
  sequence: { type: Number, required: true, default: 0 },
});

export const CertificateCounter = model("CertificateCounter", counterSchema);
