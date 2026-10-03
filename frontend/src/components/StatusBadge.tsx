import type { ReactNode } from "react";

const styles: Record<string, string> = {
  ACTIVE: "status-active",
  VALID: "status-active",
  REVOKED: "status-revoked",
  TAMPERED: "status-danger",
  NOT_FOUND: "status-muted",
  FAILED: "status-danger",
  PENDING: "status-pending",
};

export function StatusBadge({ children }: { children: ReactNode }) {
  const label = String(children);
  return <span className={`status-badge ${styles[label] || "status-muted"}`}>{label.replaceAll("_", " ")}</span>;
}