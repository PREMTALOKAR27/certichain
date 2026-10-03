import { expect } from "chai";
import { ethers } from "hardhat";
import { CertificateRegistry } from "../typechain-types";

describe("CertificateRegistry", function () {
  let registry: CertificateRegistry;
  let owner: Awaited<ReturnType<typeof ethers.getSigner>>;
  let issuer: Awaited<ReturnType<typeof ethers.getSigner>>;
  let outsider: Awaited<ReturnType<typeof ethers.getSigner>>;

  const certificateId = "CERT-2026-00001";
  const certificateHash = "0xabc123";
  const issueDate = 1790812800;

  beforeEach(async function () {
    [owner, issuer, outsider] = await ethers.getSigners();
    registry = (await ethers.deployContract(
      "CertificateRegistry",
    )) as unknown as CertificateRegistry;
    await registry.waitForDeployment();
  });

  it("sets the deployer as owner and initial authorized issuer", async function () {
    expect(await registry.owner()).to.equal(owner.address);
    expect(await registry.authorizedIssuers(owner.address)).to.equal(true);
  });

  it("lets the owner authorize an institutional issuer", async function () {
    await expect(registry.setAuthorizedIssuer(issuer.address, true))
      .to.emit(registry, "IssuerAuthorizationChanged")
      .withArgs(issuer.address, true);
    expect(await registry.authorizedIssuers(issuer.address)).to.equal(true);
  });

  it("issues and retrieves a certificate", async function () {
    await expect(
      registry.issueCertificate(certificateId, certificateHash, issueDate),
    )
      .to.emit(registry, "CertificateIssued")
      .withArgs(certificateId, certificateHash, owner.address, issueDate);

    expect(await registry.certificateExists(certificateId)).to.equal(true);
    expect(await registry.getCertificate(certificateId)).to.deep.equal([
      certificateHash,
      owner.address,
      BigInt(issueDate),
      false,
    ]);
  });

  it("prevents duplicate certificate IDs", async function () {
    await registry.issueCertificate(certificateId, certificateHash, issueDate);

    await expect(
      registry.issueCertificate(certificateId, "0xdifferent", issueDate),
    ).to.be.revertedWith("Certificate already exists");
  });

  it("verifies existence and a matching or mismatched hash", async function () {
    await registry.issueCertificate(certificateId, certificateHash, issueDate);

    expect(
      await registry.verifyCertificate(certificateId, certificateHash),
    ).to.deep.equal([true, true, false]);
    expect(
      await registry.verifyCertificate(certificateId, "0xtampered"),
    ).to.deep.equal([true, false, false]);
    expect(
      await registry.verifyCertificate("CERT-2026-99999", certificateHash),
    ).to.deep.equal([false, false, false]);
  });

  it("revokes a certificate without deleting its record", async function () {
    await registry.issueCertificate(certificateId, certificateHash, issueDate);

    await expect(registry.revokeCertificate(certificateId))
      .to.emit(registry, "CertificateRevoked")
      .withArgs(certificateId, owner.address, anyValue);

    expect(await registry.certificateExists(certificateId)).to.equal(true);
    expect(await registry.getCertificate(certificateId)).to.deep.equal([
      certificateHash,
      owner.address,
      BigInt(issueDate),
      true,
    ]);
    expect(
      await registry.verifyCertificate(certificateId, certificateHash),
    ).to.deep.equal([true, true, true]);
  });

  it("rejects an unauthorized account trying to issue or revoke", async function () {
    await expect(
      registry
        .connect(outsider)
        .issueCertificate(certificateId, certificateHash, issueDate),
    ).to.be.revertedWith("Not an authorized issuer");

    await registry.issueCertificate(certificateId, certificateHash, issueDate);
    await expect(
      registry.connect(outsider).revokeCertificate(certificateId),
    ).to.be.revertedWith("Not an authorized issuer");
  });

  it("rejects non-owners attempting to authorize issuers", async function () {
    await expect(
      registry.connect(outsider).setAuthorizedIssuer(issuer.address, true),
    ).to.be.revertedWith("Only owner");
  });

  it("rejects retrieval of a missing certificate", async function () {
    await expect(registry.getCertificate(certificateId)).to.be.revertedWith(
      "Certificate does not exist",
    );
  });
});

const anyValue = (value: unknown) => value !== undefined;
