import { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  CircleCheck,
  Clock3,
  FileCheck2,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../lib/api";
import type { Certificate, DashboardStats } from "../types";

interface CertificateListResponse {
  certificates: Certificate[];
}

export function DashboardPage() {
  const { user } = useAuth();
  const admin = user?.role === "ADMIN";
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    async function load() {
      try {
        const list = await api<CertificateListResponse>("/api/certificates");
        const dashboard = admin
          ? await api<DashboardStats>("/api/dashboard/stats")
          : null;
        if (current) {
          setCertificates(list.certificates);
          setStats(dashboard);
        }
      } catch (cause) {
        if (current)
          setError(
            cause instanceof Error ? cause.message : "Unable to load dashboard",
          );
      } finally {
        if (current) setLoading(false);
      }
    }
    void load();
    return () => {
      current = false;
    };
  }, [admin]);

  const active = certificates.filter(
    (certificate) => certificate.status === "ACTIVE",
  ).length;
  const cards = admin
    ? [
        {
          label: "Total issued",
          value: stats?.totalCertificates ?? 0,
          icon: Award,
          tone: "metric-green",
        },
        {
          label: "Active",
          value: stats?.activeCertificates ?? 0,
          icon: CircleCheck,
          tone: "metric-blue",
        },
        {
          label: "Revoked",
          value: stats?.revokedCertificates ?? 0,
          icon: ShieldAlert,
          tone: "metric-coral",
        },
        {
          label: "Verifications",
          value: stats?.totalVerifications ?? 0,
          icon: Clock3,
          tone: "metric-gold",
        },
      ]
    : [
        {
          label: "My certificates",
          value: certificates.length,
          icon: Award,
          tone: "metric-green",
        },
        {
          label: "Active",
          value: active,
          icon: CircleCheck,
          tone: "metric-blue",
        },
        {
          label: "Recently issued",
          value: certificates.filter(
            (item) =>
              Date.now() - new Date(item.issueDate).getTime() < 30 * 86400000,
          ).length,
          icon: Clock3,
          tone: "metric-gold",
        },
      ];

  return (
    <div className="page-enter">
      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">
            {admin ? "INSTITUTION OVERVIEW" : "STUDENT RECORD"}
          </span>
          <h1>{admin ? "Dashboard" : "My credentials"}</h1>
          <p>
            {admin
              ? "A live view of issued credentials and their verification activity."
              : "Your academic credentials, secured and ready to verify."}
          </p>
        </div>
        {admin && (
          <Link className="button button-primary" to="/admin/issue">
            <span>Issue certificate</span>
            <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      <section
        className={`metric-grid ${admin ? "metric-grid-four" : ""}`}
        aria-label="Summary"
      >
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div className="metric-card" key={label}>
            <div className={`metric-icon ${tone}`}>
              <Icon size={19} strokeWidth={1.8} />
            </div>
            <div className="metric-copy">
              <span>{label}</span>
              <strong>{loading ? "—" : value.toLocaleString()}</strong>
            </div>
          </div>
        ))}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {admin ? "LATEST ACTIVITY" : "YOUR RECORDS"}
            </span>
            <h2>{admin ? "Recent certificates" : "Recent certificates"}</h2>
          </div>
          <Link
            className="quiet-link"
            to={admin ? "/admin/certificates" : "/student/certificates"}
          >
            View all <ArrowRight size={15} />
          </Link>
        </div>
        <CertificateTable
          certificates={certificates.slice(0, 6)}
          loading={loading}
        />
      </section>

      {admin && (
        <section className="ledger-strip">
          <div className="ledger-mark">
            <FileCheck2 size={20} />
          </div>
          <div>
            <strong>Registry connected</strong>
            <span>
              Certificate hashes are anchored to the local Hardhat network.
            </span>
          </div>
          <Link to="/admin/blockchain" className="quiet-link">
            View chain activity <ArrowRight size={15} />
          </Link>
        </section>
      )}
    </div>
  );
}

export function CertificateTable({
  certificates,
  loading,
}: {
  certificates: Certificate[];
  loading: boolean;
}) {
  const { user } = useAuth();
  if (loading)
    return (
      <div className="loading-state">
        <span className="spinner" />
        Loading certificates…
      </div>
    );
  if (!certificates.length)
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <FileCheck2 size={23} />
        </div>
        <strong>No certificates yet</strong>
        <span>Issued certificates will appear here.</span>
      </div>
    );
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Certificate</th>
            <th>Recipient</th>
            <th>Course</th>
            <th>Issue date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {certificates.map((certificate) => (
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
                <span className="table-subline">{certificate.rollNumber}</span>
              </td>
              <td>{certificate.course}</td>
              <td>{new Date(certificate.issueDate).toLocaleDateString()}</td>
              <td>
                <StatusBadge>{certificate.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
