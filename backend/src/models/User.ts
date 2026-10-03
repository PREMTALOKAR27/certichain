import { Schema, model } from "mongoose";

export type UserRole = "ADMIN" | "STUDENT";

export interface UserRecord {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  walletAddress?: string;
}

const userSchema = new Schema<UserRecord>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["ADMIN", "STUDENT"],
      required: true,
      default: "STUDENT",
    },
    walletAddress: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_document, value) => {
        delete (value as Record<string, unknown>).passwordHash;
        return value;
      },
    },
  },
);

export const User = model<UserRecord>("User", userSchema);
