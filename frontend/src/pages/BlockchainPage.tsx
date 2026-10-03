import { useEffect, useState } from "react";
import { Blocks, ExternalLink } from "lucide-react";
import { api } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import { Link } from "react-router-dom";
import type { Certificate } from "../types";

interface ChainRecord {
  kind: "ISSUED" | "REVOKED";
  certificate: Certificate;
  blockNumber?: number;
  transactionHash: string;
  timestamp?: string;
  status: Certificate["status"];
}

export function BlockchainPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const records: ChainRecord[] = certificates
    .flatMap((certificate) => {
      const items: ChainRecord[] = [];
      if (certificate.blockchainTxHash) {
        items.push({
          kind: "ISSUED",
          certificate,
          blockNumber: certificate.blockNumber,
          transactionHash: certificate.blockchainTxHash,
          timestamp: certificate.blockTimestamp || certificate.issueDate,
          status: "ACTIVE",
        });
      }
      if (certificate.revocationTxHash) {
        items.push({
          kind: "REVOKED",
          certificate,
          blockNumber: certificate.revocationBlockNumber,
          transactionHash: certificate.revocationTxHash,
          timestamp: certificate.revocationTimestamp,
          status: "REVOKED",
        });
      }
      return items;
    })
    .sort((left, right) => (right.blockNumber || 0) - (left.blockNumber || 0));

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
              : "Unable to load chain records",
          );
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">LOCAL REGISTRY · CHAIN 31337</span>
          <h1>Chain activity</h1>
          <p>
            Issuance and revocation transactions recorded by the local Hardhat
            network.
          </p>
        </div>
        <span className="network-pill network-pill-page">
          <span className="network-dot" />
          CONNECTED
        </span>
      </div>
      <div className="chain-summary">
        <div className="chain-summary-icon">
          <Blocks size={21} />
        </div>
        <div>
          <strong>
            {records.length} blockchain transaction
            {records.length === 1 ? "" : "s"}
          </strong>
          <span>Registry contract · local development network</span>
        </div>
        <div className="chain-summary-address">
          <span>Issuer wallet</span>
          <code>
            {certificates[0]?.issuerWallet || "Connect a deployed registry"}
          </code>
        </div>
      </div>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ISSUANCE AND REVOCATION EVENTS</span>
            <h2>Transactions</h2>
          </div>
        </div>
        {loading ? (
          <div className="loading-state">
            <span className="spinner" />
            Loading chain records…
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Blocks size={23} />
            </div>
            <strong>No chain activity</strong>
            <span>
              Issue a certificate to create the first registry transaction.
            </span>
          </div>
        ) : (
          <div className="table-wrap chain-records-wrap">
            <table className="data-table chain-records-table">
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Transaction hash</th>
                  <th>Certificate ID</th>
                  <th>Certificate hash</th>
                  <th>Issuer</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={`${record.certificate._id}-${record.kind}`}>
                    <td className="chain-block">{record.blockNumber ?? "—"}</td>
                    <td>
                      <code
                        className="chain-full-hash"
                        title={record.transactionHash}
                      >
                        {record.transactionHash}
                      </code>
                    </td>
                    <td>
                      <span className="mono-text">
                        {record.certificate.certificateId}
                      </span>
                      <span className="table-subline">{record.kind}</span>
                    </td>
                    <td>
                      <code
                        className="chain-full-hash"
                        title={record.certificate.certificateHash}
                      >
                        {record.certificate.certificateHash}
                      </code>
                    </td>
                    <td>
                      <code
                        className="chain-full-hash"
                        title={record.certificate.issuerWallet}
                      >
                        {record.certificate.issuerWallet}
                      </code>
                    </td>
                    <td>
                      {record.timestamp
                        ? new Date(record.timestamp).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      <StatusBadge>{record.status}</StatusBadge>
                    </td>
                    <td>
                      <Link
                        className="button-icon chain-record-link"
                        to={`/admin/certificates/${record.certificate.certificateId}`}
                        aria-label={`Open ${record.certificate.certificateId}`}
                        title="Open certificate"
                      >
                        <ExternalLink size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
