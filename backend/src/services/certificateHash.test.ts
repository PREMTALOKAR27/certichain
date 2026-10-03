import assert from "node:assert/strict";
import test from "node:test";
import { hashCertificate } from "./certificateHash";

const certificate = {
  certificateId: "CERT-2026-00001",
  studentName: "Jose\u0301 Student",
  rollNumber: "BCF-2026-001",
  course: "Blockchain Fundamentals",
  department: "Computer Science",
  institution: "CERTICHAIN College",
  academicYear: "2025-2026",
  certificateType: "Practical Completion",
  issueDate: new Date("2026-10-01T12:00:00.000Z"),
  issuerName: "CERTICHAIN Administrator",
};

test("certificate hashing is deterministic", () => {
  assert.equal(
    hashCertificate(certificate),
    hashCertificate({ ...certificate }),
  );
});

test("canonical hashing normalizes Unicode and trims field whitespace", () => {
  const normalized = {
    ...certificate,
    studentName: "  Jos\u00e9 Student  ",
  };
  assert.equal(hashCertificate(certificate), hashCertificate(normalized));
});

test("changing certificate data changes its hash", () => {
  assert.notEqual(
    hashCertificate(certificate),
    hashCertificate({ ...certificate, studentName: "Different Student" }),
  );
});
