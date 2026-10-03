import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Fingerprint,
  ShieldAlert,
  ShieldCheck,
  Search,
  TriangleAlert,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../lib/api";
import type { VerificationResponse } from "../types";

export function VerifyPage() {
  const { user } = useAuth();
  const { certificateId } = useParams();
  const [input, setInput] = useState(certificateId || "");
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(certificateId));
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const workspacePath =
    user?.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard";
  const workspaceName = user?.role === "ADMIN" ? "Institution" : "Student";

  useEffect(() => {
    if (!certificateId) {
      setResult(null);
      setLoading(false);
      return;
    }
    let current = true;
    setLoading(true);
    setError("");
    api<VerificationResponse>(
      `/api/verify/${encodeURIComponent(certificateId)}`,
    )
      .then((response) => {
        if (!current) return;
        setResult(response);
      })
      .catch((cause) => {
        if (current)
          setError(
            cause instanceof Error ? cause.message : "Verification failed",
          );
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [certificateId]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const id = input.trim();
    if (id) navigate(`/verify/${encodeURIComponent(id)}`);
  }

  const publicHeader = (
    <header className="public-header">
      <Link to="/verify" className="brand">
        <span className="brand-mark">
          <BadgeCheck size={21} />
        </span>
        <span>
          <strong>CERTICHAIN</strong>
          <small>ACADEMIC RECORDS</small>
        </span>
      </Link>
      <div className="public-header-actions">
        <Link to="/about-blockchain" className="public-about">
          About blockchain
        </Link>
        {user ? (
          <>
            <Link to={workspacePath} className="button button-outline">
              <span className="workspace-full">{workspaceName} workspace</span>
              <span className="workspace-short">
                {user.role === "ADMIN" ? "Admin" : "Student"}
              </span>
              <ArrowRight size={15} />
            </Link>
          </>
        ) : (
          <Link to="/login/institution" className="button button-outline">
            login <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </header>
  );

  return (
    <div className="public-page">
      {publicHeader}
      {!certificateId ? (
        <main className="verify-landing">
          <div className="verify-ornament">
            <Fingerprint size={38} strokeWidth={1.35} />
          </div>
          <span className="eyebrow">PUBLIC CREDENTIAL CHECK</span>
          <h1>
            Proof for every
            <br />
            <em>achievement.</em>
          </h1>
          <p>
            Verify the authenticity of an academic certificate against its
            institution's blockchain record.
          </p>
          <form className="verify-search" onSubmit={submit}>
            <Search size={19} />
            <input
              aria-label="Certificate ID"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Enter certificate ID"
              required
            />
            <button
              className="button button-primary"
              aria-label="Verify certificate"
            >
              <span>Verify</span>
              <ArrowRight size={16} />
            </button>
          </form>
          <div className="verify-caption">
            <ShieldCheck size={15} />
            No account required <span />
            No certificate file uploaded
          </div>
          <div className="verify-watermark">
            CERTIFICATE REGISTRY <span>01 / PUBLIC</span>
          </div>
        </main>
      ) : (
        <main className="verify-result-page">
          <Link to="/verify" className="back-link">
            <ArrowLeft size={15} />
            Check another certificate
          </Link>
          <div className="verify-result-head">
            <span className="eyebrow">CERTIFICATE VERIFICATION</span>
            <h1>{certificateId}</h1>
          </div>
          {loading && (
            <div className="loading-state">
              <span className="spinner" />
              Checking certificate record…
            </div>
          )}
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
          {!loading && result && <VerificationResult result={result} />}
        </main>
      )}
      <footer className="public-footer">
        <span>Academic credentials, made verifiable.</span>
        <span>LOCAL NETWORK · HARDHAT 31337</span>
      </footer>
    </div>
  );
}

function VerificationResult({ result }: { result: VerificationResponse }) {
  const config = {
    VALID: {
      title: "Certificate Verified",
      detail: "Certificate details match the hash recorded by the institution.",
      icon: ShieldCheck,
      tone: "result-valid",
    },
    TAMPERED: {
      title: "Certificate Tampered",
      detail:
        "The submitted certificate details do not match the blockchain hash.",
      icon: ShieldAlert,
      tone: "result-tampered",
    },
    REVOKED: {
      title: "Certificate Revoked",
      detail:
        "The institution has revoked this certificate. Its blockchain record remains intact.",
      icon: TriangleAlert,
      tone: "result-revoked",
    },
    NOT_FOUND: {
      title: "Certificate Not Found",
      detail: "No issued certificate with this ID was found in the registry.",
      icon: Search,
      tone: "result-not-found",
    },
  }[result.result];
  const Icon = config.icon;

  return (
    <div className="verification-layout">
      <section className={`result-banner ${config.tone}`}>
        <div className="result-symbol">
          <Icon size={25} />
        </div>
        <div className="result-copy">
          <span className="eyebrow">REGISTRY RESULT</span>
          <h2>{config.title}</h2>
          <p>{config.detail}</p>
        </div>
        <StatusBadge>{result.result}</StatusBadge>
      </section>
      {result.certificate && (
        <>
          <section className="verify-detail-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ISSUED CREDENTIAL</span>
                <h2>Certificate details</h2>
              </div>
              <span className="detail-stamp">
                <BadgeCheck size={15} />
                ON RECORD
              </span>
            </div>
            <div className="detail-grid">
              <Detail label="Student" value={result.certificate.studentName} />
              <Detail
                label="Roll number"
                value={result.certificate.rollNumber}
              />
              <Detail label="Course" value={result.certificate.course} />
              <Detail
                label="Department"
                value={result.certificate.department}
              />
              <Detail
                label="Institution"
                value={result.certificate.institution}
              />
              <Detail
                label="Academic year"
                value={result.certificate.academicYear}
              />
              <Detail
                label="Certificate type"
                value={result.certificate.certificateType}
              />
              <Detail
                label="Issue date"
                value={new Date(
                  result.certificate.issueDate,
                ).toLocaleDateString()}
              />
              <Detail label="Issuer" value={result.certificate.issuerName} />
            </div>
          </section>
          <section className="hash-panel">
            <div className="hash-panel-heading">
              <div>
                <Fingerprint size={18} />
                <div>
                  <strong>Cryptographic proof</strong>
                  <span>Recalculated from canonical certificate data</span>
                </div>
              </div>
              <StatusBadge>
                {result.blockchain?.hashMatches ? "VALID" : "TAMPERED"}
              </StatusBadge>
            </div>
            <HashRow
              label="Blockchain hash"
              value={result.blockchain?.hash || result.originalHash || "—"}
            />
            <HashRow
              label="Submitted hash"
              value={result.submittedHash || "—"}
              mismatch={result.blockchain?.hashMatches === false}
            />
            {result.result === "TAMPERED" && (
              <div className="tamper-notice" role="status">
                Stored certificate details differ from the original blockchain
                record. Verify the MongoDB values and restore the intended data.
              </div>
            )}
          </section>
          <section className="chain-proof-row">
            <div>
              <span>ISSUANCE TRANSACTION</span>
              <code>
                {result.blockchain?.transactionHash || "Not available"}
              </code>
            </div>
            <div>
              <span>BLOCK</span>
              <code>{result.blockchain?.blockNumber ?? "—"}</code>
            </div>
            <div>
              <span>ISSUER WALLET</span>
              <code>{result.blockchain?.issuer || "—"}</code>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-cell">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function HashRow({
  label,
  value,
  mismatch,
}: {
  label: string;
  value: string;
  mismatch?: boolean;
}) {
  return (
    <div className={`hash-row ${mismatch ? "hash-row-mismatch" : ""}`}>
      <span>{label}</span>
      <code>{value}</code>
      {mismatch && <b>HASH MISMATCH</b>}
    </div>
  );
}
