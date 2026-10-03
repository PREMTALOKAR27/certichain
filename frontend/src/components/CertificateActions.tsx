import { useState } from "react";
import { Ban, Download, QrCode, X } from "lucide-react";
import { api, downloadCertificate } from "../lib/api";
import type { Certificate } from "../types";

interface CertificateActionsProps {
  certificate: Certificate;
  canRevoke?: boolean;
  onRevoked?: (certificate: Certificate) => void;
}

export function CertificateActions({
  certificate,
  canRevoke = false,
  onRevoked,
}: CertificateActionsProps) {
  const [qrCode, setQrCode] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [busy, setBusy] = useState<"download" | "qr" | "revoke" | null>(null);
  const [error, setError] = useState("");

  async function download() {
    setBusy("download");
    setError("");
    try {
      await downloadCertificate(certificate.certificateId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to download certificate",
      );
    } finally {
      setBusy(null);
    }
  }

  async function showQr() {
    setBusy("qr");
    setError("");
    try {
      const result = await api<{ qrCode: string; verificationUrl: string }>(
        `/api/certificates/${encodeURIComponent(certificate.certificateId)}/qr`,
      );
      setQrCode(result.qrCode);
      setVerificationUrl(result.verificationUrl);
      setQrOpen(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load QR code",
      );
    } finally {
      setBusy(null);
    }
  }

  async function revoke() {
    setBusy("revoke");
    setError("");
    try {
      const result = await api<{ certificate: Certificate }>(
        `/api/certificates/${encodeURIComponent(certificate.certificateId)}/revoke`,
        { method: "PATCH" },
      );
      onRevoked?.(result.certificate);
      setConfirmRevoke(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to revoke certificate",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="certificate-actions">
        <button
          type="button"
          className="button-icon action-control"
          aria-label={`Download ${certificate.certificateId} PDF`}
          title="Download certificate PDF"
          disabled={busy !== null}
          onClick={download}
        >
          <Download size={16} />
        </button>
        <button
          type="button"
          className="button-icon action-control"
          aria-label={`Show ${certificate.certificateId} QR code`}
          title="View verification QR code"
          disabled={busy !== null}
          onClick={showQr}
        >
          <QrCode size={16} />
        </button>
        {canRevoke && certificate.status === "ACTIVE" && (
          <button
            type="button"
            className="button-icon action-control action-danger"
            aria-label={`Revoke ${certificate.certificateId}`}
            title="Revoke certificate"
            disabled={busy !== null}
            onClick={() => {
              setError("");
              setConfirmRevoke(true);
            }}
          >
            <Ban size={16} />
          </button>
        )}
      </div>
      {error && (
        <span className="action-error" role="alert">
          {error}
        </span>
      )}
      {qrOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setQrOpen(false);
          }}
        >
          <section
            className="action-modal qr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-modal-title"
          >
            <button
              type="button"
              className="button-icon modal-close"
              aria-label="Close QR code"
              onClick={() => setQrOpen(false)}
            >
              <X size={18} />
            </button>
            <span className="eyebrow">PUBLIC VERIFICATION LINK</span>
            <h2 id="qr-modal-title">Certificate QR code</h2>
            <p>Scan to open this certificate's public verification page.</p>
            <img
              className="qr-image"
              src={qrCode}
              alt={`QR code for ${certificate.certificateId}`}
            />
            <code className="qr-url">{verificationUrl}</code>
            <a
              className="button button-primary qr-open-link"
              href={verificationUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open verifier
            </a>
          </section>
        </div>
      )}
      {confirmRevoke && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="action-modal revoke-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-modal-title"
          >
            <button
              type="button"
              className="button-icon modal-close"
              aria-label="Cancel revocation"
              onClick={() => setConfirmRevoke(false)}
            >
              <X size={18} />
            </button>
            <div className="revoke-symbol">
              <Ban size={21} />
            </div>
            <span className="eyebrow">CONFIRM REVOCATION</span>
            <h2 id="revoke-modal-title">Revoke this certificate?</h2>
            <p>
              <strong>{certificate.certificateId}</strong> will be marked
              revoked in the registry. Its issuance record will remain on-chain.
            </p>
            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="button button-outline"
                disabled={busy !== null}
                onClick={() => setConfirmRevoke(false)}
              >
                Keep active
              </button>
              <button
                type="button"
                className="button button-revoke"
                disabled={busy !== null}
                onClick={revoke}
              >
                {busy === "revoke" ? "Revoking…" : "Revoke certificate"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
