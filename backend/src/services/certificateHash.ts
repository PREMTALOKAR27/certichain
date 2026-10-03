import { keccak256, toUtf8Bytes } from "ethers";

export interface CanonicalCertificateData {
  certificateId: string;
  studentName: string;
  rollNumber: string;
  course: string;
  department: string;
  institution: string;
  academicYear: string;
  certificateType: string;
  issueDate: Date;
  issuerName: string;
}

function clean(value: string): string {
  return value.normalize("NFC").trim();
}

export function canonicalizeCertificate(
  data: CanonicalCertificateData,
): string {
  return JSON.stringify([
    clean(data.certificateId),
    clean(data.studentName),
    clean(data.rollNumber),
    clean(data.course),
    clean(data.department),
    clean(data.institution),
    clean(data.academicYear),
    clean(data.certificateType),
    data.issueDate.toISOString(),
    clean(data.issuerName),
  ]);
}

export function hashCertificate(data: CanonicalCertificateData): string {
  return keccak256(toUtf8Bytes(canonicalizeCertificate(data)));
}
