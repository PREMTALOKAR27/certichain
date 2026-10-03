import "dotenv/config";
import { isAddress } from "ethers";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const registryAddress = required("CERTIFICATE_REGISTRY_ADDRESS");
if (!isAddress(registryAddress)) {
  throw new Error(
    "CERTIFICATE_REGISTRY_ADDRESS must be a valid Ethereum address",
  );
}

const jwtSecret = required("JWT_SECRET");
if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters");
}

const adminPassword = required("ADMIN_PASSWORD");
if (adminPassword.length < 12) {
  throw new Error("ADMIN_PASSWORD must be at least 12 characters");
}

const issuerAccountIndex = Number(process.env.ISSUER_ACCOUNT_INDEX || 0);
if (!Number.isInteger(issuerAccountIndex) || issuerAccountIndex < 0) {
  throw new Error("ISSUER_ACCOUNT_INDEX must be a non-negative integer");
}

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/certichain",
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  rpcUrl: process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545",
  registryAddress,
  issuerAccountIndex,
  adminName: process.env.ADMIN_NAME?.trim() || "CertiChain Administrator",
  adminEmail: required("ADMIN_EMAIL").toLowerCase(),
  adminPassword,
};
