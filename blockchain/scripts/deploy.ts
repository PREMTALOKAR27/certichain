import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const registry = await ethers.deployContract("CertificateRegistry");
  await registry.waitForDeployment();

  console.log("CertificateRegistry deployed to:", await registry.getAddress());
  console.log("Owner and initial authorized issuer:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
