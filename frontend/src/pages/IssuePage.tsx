import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, BadgeCheck, CircleCheck, FilePlus2 } from "lucide-react";
import { Link } from "react-router-dom";
import { CertificateActions } from "../components/CertificateActions";
import { api } from "../lib/api";
import type { Certificate } from "../types";

const fields = [
  {
    name: "studentName",
    label: "Student name",
    placeholder: "As it should appear on the certificate",
  },
  {
    name: "studentEmail",
    label: "Student account email",
    placeholder: "Optional · link to an existing student",
  },
  {
    name: "rollNumber",
    label: "Roll number",
    placeholder: "e.g. CSE-2026-014",
  },
  {
    name: "course",
    label: "Course",
    placeholder: "e.g. Bachelor of Computer Science",
  },
  {
    name: "department",
    label: "Department",
    placeholder: "e.g. Computer Science and Engineering",
  },
  {
    name: "institution",
    label: "Institution",
    placeholder: "Institution name",
  },
  {
    name: "academicYear",
    label: "Academic year",
    placeholder: "e.g. 2025–2026",
  },
  {
    name: "certificateType",
    label: "Certificate type",
    placeholder: "e.g. Course completion",
  },
] as const;

export function IssuePage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setCertificate(null);
    setLoading(true);
    try {
      const result = await api<{ certificate: Certificate }>(
        "/api/certificates",
        {
          method: "POST",
          body: JSON.stringify(values),
        },
      );
      setCertificate(result.certificate);
      setValues({});
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to issue certificate",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">NEW CREDENTIAL</span>
          <h1>Issue certificate</h1>
          <p>
            Register the student's details and anchor a verification hash on the
            local blockchain.
          </p>
        </div>
      </div>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {certificate && (
        <div className="success-panel" role="status">
          <div className="success-icon">
            <CircleCheck size={21} />
          </div>
          <div className="success-copy">
            <strong>Certificate issued successfully</strong>
            <span>
              {certificate.certificateId} is {certificate.status.toLowerCase()}{" "}
              on the local registry.
            </span>
          </div>
          <Link
            to={`/admin/certificates/${certificate.certificateId}`}
            className="quiet-link"
          >
            View record <ArrowRight size={15} />
          </Link>
          <CertificateActions
            certificate={certificate}
            canRevoke
            onRevoked={setCertificate}
          />
        </div>
      )}
      <div className="issue-layout">
        <form className="panel issue-form" onSubmit={submit}>
          <div className="panel-heading">
            <div className="panel-heading-icon">
              <FilePlus2 size={18} />
            </div>
            <div>
              <h2>Certificate details</h2>
              <span>All fields except student email are required.</span>
            </div>
          </div>
          <div className="form-grid">
            {fields.map((field) => (
              <label className="field" key={field.name}>
                <span>
                  {field.label}
                  {field.name === "studentEmail" && <em>Optional</em>}
                </span>
                <input
                  type={field.name === "studentEmail" ? "email" : "text"}
                  value={values[field.name] || ""}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    setValues({ ...values, [field.name]: event.target.value })
                  }
                  required={field.name !== "studentEmail"}
                />
              </label>
            ))}
          </div>
          <div className="form-foot">
            <div className="hash-note">
              <BadgeCheck size={16} />
              <span>
                Certificate details are hashed before issuance.
                <br />
                The PDF itself is never stored on-chain.
              </span>
            </div>
            <button className="button button-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner spinner-light" />
                  Issuing…
                </>
              ) : (
                <>
                  Issue credential <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
        <aside className="issue-aside">
          <span className="eyebrow">ON-CHAIN RECORD</span>
          <h2>
            One hash.
            <br />A lasting proof.
          </h2>
          <p>
            Issuing stores a cryptographic fingerprint, your wallet address, and
            the block timestamp. Certificate details stay in the local database.
          </p>
          <div className="issue-step">
            <span>01</span>
            <div>
              <strong>Canonicalize</strong>
              <small>Fields are normalized in a fixed order.</small>
            </div>
          </div>
          <div className="issue-step">
            <span>02</span>
            <div>
              <strong>Hash</strong>
              <small>Keccak-256 creates a unique fingerprint.</small>
            </div>
          </div>
          <div className="issue-step">
            <span>03</span>
            <div>
              <strong>Register</strong>
              <small>The issuer wallet anchors it to Hardhat.</small>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
