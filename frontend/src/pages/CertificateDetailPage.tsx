import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  CalendarDays,
  Landmark,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { CertificateActions } from "../components/CertificateActions";
import { api } from "../lib/api";
import type { Certificate } from "../types";

export function CertificateDetailPage() {
  const { certificateId } = useParams();
  const { user } = useAuth();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const listPath = user?.role === "ADMIN" ? "/admin/certificates" : "/student/certificates";
  const status = certificate?.status === "REVOKED" ? "REVOKED" : "VERIFIED";
  const isRevoked = status === "REVOKED";

  useEffect(() => {
    if (!certificateId) return;
    let current = true;
    setLoading(true);
    setError("");
    api<{ certificate: Certificate }>(
      `/api/certificates/${encodeURIComponent(certificateId)}`,
    )
      .then((result) => {
        if (current) setCertificate(result.certificate);
      })
      .catch((cause) => {
        if (current) {
          setError(
            cause instanceof Error ? cause.message : "Unable to load certificate",
          );
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [certificateId]);

  return (
    <div className="page-enter certificate-page">
      <div className="certificate-page-top">
        <Link to={listPath} className="back-link">
          <ArrowLeft size={15} />
          Back to certificates
        </Link>
        {certificate && (
          <CertificateActions
            certificate={certificate}
            canRevoke={user?.role === "ADMIN"}
            onRevoked={setCertificate}
          />
        )}
      </div>

      {loading && (
        <div className="loading-state">
          <span className="spinner" />
          Loading certificate...
        </div>
      )}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {!loading && certificate && (
        <>
          <section className={`premium-certificate ${isRevoked ? "certificate-revoked" : ""}`}>
            <div className="certificate-frame">
              <div className="certificate-heading-row">
                <div className="certificate-brand">
                  <span className="certificate-brand-mark">
                    <Award size={24} />
                  </span>
                  <span>
                    <strong>CERTICHAIN</strong>
                    <small>ACADEMIC RECORDS</small>
                  </span>
                </div>
                <div className={`certificate-status ${isRevoked ? "certificate-status-revoked" : ""}`}>
                  {isRevoked ? <TriangleAlert size={15} /> : <ShieldCheck size={15} />}
                  {isRevoked ? "REVOKED" : "VERIFIED"}
                </div>
              </div>

              <div className="certificate-title-block">
                <span>THIS IS TO CERTIFY THAT</span>
                <h1>{certificate.studentName}</h1>
                <p>
                  has successfully completed the requirements for
                </p>
                <h2>{certificate.course}</h2>
              </div>

              <div className="certificate-facts">
                <CertificateFact label="Department" value={certificate.department} />
                <CertificateFact label="Academic year" value={certificate.academicYear} />
                <CertificateFact label="Certificate type" value={certificate.certificateType} />
              </div>

              <div className="certificate-footer-row">
                <div className="certificate-signature">
                  <span>{certificate.issuerName}</span>
                  <small>AUTHORIZED ISSUER</small>
                </div>
                <div className="certificate-seal" aria-label="Certificate registry seal">
                  <BadgeCheck size={27} />
                  <span>REGISTERED</span>
                </div>
                <div className="certificate-date">
                  <span>{new Date(certificate.issueDate).toLocaleDateString()}</span>
                  <small>DATE OF ISSUE</small>
                </div>
              </div>
            </div>
          </section>

          <section className="certificate-record" aria-label="Certificate record details">
            <div className="certificate-record-heading">
              <div>
                <span className="eyebrow">REGISTRY RECORD</span>
                <h2>Certificate details</h2>
              </div>
              <span className={`record-status ${isRevoked ? "record-status-revoked" : ""}`}>
                {isRevoked ? <TriangleAlert size={15} /> : <BadgeCheck size={15} />}
                {isRevoked ? "Revoked" : "Verified"}
              </span>
            </div>
            <div className="certificate-record-grid">
              <RecordDetail icon={BadgeCheck} label="Certificate ID" value={certificate.certificateId} mono />
              <RecordDetail icon={Landmark} label="Institution" value={certificate.institution} />
              <RecordDetail icon={Award} label="Recipient roll number" value={certificate.rollNumber} />
              <RecordDetail icon={CalendarDays} label="Issued on" value={new Date(certificate.issueDate).toLocaleDateString()} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function CertificateFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RecordDetail({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof Award;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="record-detail">
      <Icon size={17} />
      <div>
        <span>{label}</span>
        <strong className={mono ? "mono-text" : ""}>{value}</strong>
      </div>
    </div>
  );
}
