export type UserRole = "ADMIN" | "STUDENT";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Certificate {
  _id: string;
  certificateId: string;
  studentName: string;
  rollNumber: string;
  course: string;
  department: string;
  institution: string;
  academicYear: string;
  certificateType: string;
  issueDate: string;
  issuerName: string;
  certificateHash: string;
  blockchainTxHash?: string;
  blockNumber?: number;
  blockTimestamp?: string;
  revocationTxHash?: string;
  revocationBlockNumber?: number;
  revocationTimestamp?: string;
  issuerWallet: string;
  status: "PENDING" | "ACTIVE" | "REVOKED" | "FAILED";
  createdAt: string;
}

export interface VerificationResponse {
  result: "VALID" | "TAMPERED" | "REVOKED" | "NOT_FOUND";
  certificate?: Pick<
    Certificate,
    | "certificateId"
    | "studentName"
    | "rollNumber"
    | "course"
    | "department"
    | "institution"
    | "academicYear"
    | "certificateType"
    | "issueDate"
    | "issuerName"
  >;
  originalHash?: string;
  submittedHash?: string;
  blockchain?: {
    exists: boolean;
    hashMatches: boolean;
    revoked: boolean;
    hash: string;
    transactionHash?: string;
    blockNumber?: number;
    revocationTransactionHash?: string;
    revocationBlockNumber?: number;
    issuer?: string;
  };
}

export interface DashboardStats {
  totalCertificates: number;
  activeCertificates: number;
  revokedCertificates: number;
  totalVerifications: number;
}

export interface VerificationRecord {
  _id: string;
  certificateId: string;
  verifiedAt: string;
  result: VerificationResponse["result"];
}
