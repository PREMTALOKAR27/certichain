import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { CertificateActions } from "../components/CertificateActions";
import { StatusBadge } from "../components/StatusBadge";
import { FileCheck2, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { CertificateTable } from "./DashboardPage";
import { api } from "../lib/api";
import type { Certificate } from "../types";

export function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    api<{ certificates: Certificate[] }>("/api/certificates")
      .then((result) => {
        if (current) setCertificates(result.certificates);
      })
      .catch((cause) => {
        if (current)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load certificates",
          );
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const visible = certificates.filter((certificate) =>
    [
      certificate.certificateId,
      certificate.studentName,
      certificate.rollNumber,
      certificate.course,
    ].some((value) => value.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACADEMIC RECORDS</span>
          <h1>Certificates</h1>
          <p>Browse, search, and verify certificate records.</p>
        </div>
        <span className="count-chip">
          <FileCheck2 size={15} />
          {certificates.length} records
        </span>
      </div>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      <div className="toolbar-row">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Search certificates"
            placeholder="Search ID, student, roll number, or course"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      {loading ? (
        <CertificateTable certificates={visible} loading />
      ) : visible.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table certificate-list-table">
            <thead>
              <tr>
                <th>Certificate</th>
                <th>Recipient</th>
                <th>Course</th>
                <th>Issue date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((certificate) => (
                <tr key={certificate._id}>
                  <td>
                    <Link
                      className="mono-link"
                      to={`${user?.role === "ADMIN" ? "/admin" : "/student"}/certificates/${certificate.certificateId}`}
                    >
                      {certificate.certificateId}
                    </Link>
                  </td>
                  <td>
                    <strong className="table-primary">
                      {certificate.studentName}
                    </strong>
                    <span className="table-subline">
                      {certificate.rollNumber}
                    </span>
                  </td>
                  <td>{certificate.course}</td>
                  <td>
                    {new Date(certificate.issueDate).toLocaleDateString()}
                  </td>
                  <td>
                    <StatusBadge>{certificate.status}</StatusBadge>
                  </td>
                  <td>
                    <CertificateActions
                      certificate={certificate}
                      canRevoke={user?.role === "ADMIN"}
                      onRevoked={(updated) =>
                        setCertificates((current) =>
                          current.map((item) =>
                            item._id === updated._id ? updated : item,
                          ),
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Search size={23} />
          </div>
          <strong>No matching certificates</strong>
          <span>Try another name, ID, or course.</span>
          <Link className="quiet-link" to="/verify">
            Open public verifier
          </Link>
        </div>
      )}
    </div>
  );
}
