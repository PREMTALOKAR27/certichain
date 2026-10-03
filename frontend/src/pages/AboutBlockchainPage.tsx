import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  BookOpenCheck,
  Fingerprint,
  GitCommitHorizontal,
  LockKeyhole,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";

const concepts = [
  {
    number: "01",
    title: "Blockchain",
    icon: Blocks,
    text: "A shared ledger maintained by a network of computers. CERTICHAIN uses a local Hardhat network, so the practical runs on your own machine.",
  },
  {
    number: "02",
    title: "Block",
    icon: GitCommitHorizontal,
    text: "A block groups transactions in order. Each transaction receives a block number that can be inspected after a certificate is issued.",
  },
  {
    number: "03",
    title: "Hash",
    icon: Fingerprint,
    text: "A cryptographic fingerprint calculated from certificate data. A small change to the student, course, or date produces a different hash.",
  },
  {
    number: "04",
    title: "Immutability",
    icon: LockKeyhole,
    text: "Once a transaction is included in a block, the local ledger preserves that record. Revocation changes certificate status without erasing the issue transaction.",
  },
  {
    number: "05",
    title: "Smart contract",
    icon: Workflow,
    text: "A program deployed to the chain. The CertificateRegistry checks issuer permissions, rejects duplicate IDs, and stores certificate hashes.",
  },
  {
    number: "06",
    title: "Transaction",
    icon: ShieldCheck,
    text: "A signed request that changes blockchain state. Issuing or revoking a credential creates a transaction with a hash and block number.",
  },
];

export function AboutBlockchainPage({
  publicPage = false,
}: {
  publicPage?: boolean;
}) {
  return (
    <div
      className={
        publicPage ? "public-page about-public" : "about-page page-enter"
      }
    >
      {publicPage && (
        <header className="public-header">
          <Link to="/verify" className="brand">
            <span className="brand-mark">
              <BookOpenCheck size={21} />
            </span>
            <span>
              <strong>CERTICHAIN</strong>
              <small>ACADEMIC RECORDS</small>
            </span>
          </Link>
          <Link to="/verify" className="button button-outline">
            Public verifier <ArrowRight size={15} />
          </Link>
        </header>
      )}
      <main className="about-content">
        {!publicPage && (
          <Link to="/admin/dashboard" className="back-link">
            <ArrowLeft size={15} />
            Back to workspace
          </Link>
        )}
        <div className="about-intro">
          <span className="eyebrow">THE TECHNOLOGY, PLAINLY</span>
          <h1>
            How the chain
            <br />
            <em>keeps its word.</em>
          </h1>
          <p>
            A short guide to the building blocks behind certificate
            verification.
          </p>
        </div>
        <div className="concept-list">
          {concepts.map(({ number, title, icon: Icon, text }) => (
            <article className="concept-row" key={title}>
              <span className="concept-number">{number}</span>
              <div className="concept-icon">
                <Icon size={20} />
              </div>
              <div>
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="about-callout">
          <ShieldCheck size={19} />
          <p>
            <strong>Certificate verification</strong> recalculates the
            certificate hash, compares it with the registry, and checks whether
            the issuer has revoked it.
          </p>
          <Link to="/verify">
            Open verifier <ArrowRight size={14} />
          </Link>
        </div>
      </main>
      {publicPage && (
        <footer className="public-footer">
          <span>Academic credentials, made verifiable.</span>
          <span>LOCAL NETWORK · HARDHAT 31337</span>
        </footer>
      )}
    </div>
  );
}
