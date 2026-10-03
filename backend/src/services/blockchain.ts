import { Contract, JsonRpcProvider } from "ethers";
import { config } from "../config/env";

const registryAbi = [
  "function issueCertificate(string certificateId, string certificateHash, uint256 issueDate)",
  "function getCertificate(string certificateId) view returns (string certificateHash, address issuer, uint256 issueDate, bool revoked)",
  "function verifyCertificate(string certificateId, string certificateHash) view returns (bool exists, bool hashMatches, bool revoked)",
  "function revokeCertificate(string certificateId)",
];

const provider = new JsonRpcProvider(config.rpcUrl, 31337);
const registry = new Contract(config.registryAddress, registryAbi, provider);

async function registryForIssuer() {
  const signer = await provider.getSigner(config.issuerAccountIndex);
  return new Contract(config.registryAddress, registryAbi, signer);
}

export async function issueOnChain(
  certificateId: string,
  certificateHash: string,
  issueDate: Date,
) {
  const issuerRegistry = await registryForIssuer();
  const transaction = await issuerRegistry.getFunction("issueCertificate")(
    certificateId,
    certificateHash,
    BigInt(Math.floor(issueDate.getTime() / 1000)),
  );
  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1)
    throw new Error("Certificate transaction failed");
  const block = await provider.getBlock(receipt.blockNumber);
  if (!block) throw new Error("Unable to read certificate issue block");
  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    blockTimestamp: new Date(block.timestamp * 1000),
  };
}

export async function verifyOnChain(
  certificateId: string,
  certificateHash: string,
) {
  const result = await registry.getFunction("verifyCertificate")(
    certificateId,
    certificateHash,
  );
  const exists = Boolean(result[0]);
  const certificate = exists
    ? await registry.getFunction("getCertificate")(certificateId)
    : null;
  return {
    exists,
    hashMatches: Boolean(result[1]),
    revoked: Boolean(result[2]),
    certificateHash: certificate ? String(certificate[0]) : null,
  };
}

export async function revokeOnChain(certificateId: string) {
  const issuerRegistry = await registryForIssuer();
  const transaction =
    await issuerRegistry.getFunction("revokeCertificate")(certificateId);
  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1)
    throw new Error("Revocation transaction failed");
  const block = await provider.getBlock(receipt.blockNumber);
  if (!block) throw new Error("Unable to read certificate revocation block");
  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    blockTimestamp: new Date(block.timestamp * 1000),
  };
}

export async function getIssuerWalletAddress() {
  const signer = await provider.getSigner(config.issuerAccountIndex);
  return signer.getAddress();
}
