import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { config } from "../config/env";
import type { CertificateRecord } from "../models/Certificate";

export function verificationUrl(certificateId: string) {
  const origin = config.frontendOrigin.replace(/\/$/, "");
  return `${origin}/verify/${encodeURIComponent(certificateId)}`;
}

export async function createQrDataUrl(certificateId: string) {
  return QRCode.toDataURL(verificationUrl(certificateId), {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: { dark: "#183c35", light: "#ffffff" },
  });
}

export async function createCertificatePdf(certificate: CertificateRecord) {
  const qrBuffer = await QRCode.toBuffer(
    verificationUrl(certificate.certificateId),
    {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: { dark: "#183c35", light: "#ffffff" },
    },
  );

  return new Promise<Buffer>((resolve, reject) => {
    const document = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 0,
      info: {
        Title: `${certificate.certificateType} | ${certificate.certificateId}`,
        Author: certificate.issuerName,
        Subject: `${certificate.certificateType} for ${certificate.studentName}`,
      },
    });
    const chunks: Buffer[] = [];
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    const width = document.page.width;
    const height = document.page.height;
    const center = width / 2;
    const ink = "#183c35";
    const gold = "#a8894e";
    const muted = "#718077";

    document.rect(0, 0, width, height).fill("#fbf9f2");
    document.rect(0, 0, width, 11).fill(ink);
    document.rect(0, height - 11, width, 11).fill(ink);
    document
      .rect(24, 23, width - 48, height - 46)
      .lineWidth(1.8)
      .stroke(ink);
    document
      .rect(32, 31, width - 64, height - 62)
      .lineWidth(0.65)
      .stroke(gold);

    const cornerSize = 15;
    for (const [x, y, xDirection, yDirection] of [
      [42, 41, 1, 1],
      [width - 42, 41, -1, 1],
      [42, height - 41, 1, -1],
      [width - 42, height - 41, -1, -1],
    ]) {
      document
        .moveTo(x, y + yDirection * cornerSize)
        .lineTo(x, y)
        .lineTo(x + xDirection * cornerSize, y)
        .lineWidth(1)
        .stroke(gold);
    }

    document
      .fillColor(muted)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("CERTICHAIN  /  ACADEMIC RECORDS", 70, 50, {
        width: width - 140,
        align: "center",
        characterSpacing: 1.7,
      });

    document.circle(center, 91, 23).lineWidth(1.25).stroke(gold);
    document.circle(center, 91, 18).lineWidth(0.55).stroke("#d7c79e");
    document
      .fillColor(ink)
      .font("Times-Bold")
      .fontSize(21)
      .text("C", center - 12, 77, { width: 24, align: "center" });

    document
      .font("Times-Roman")
      .fillColor(ink)
      .fontSize(
        fitFontSize(
          document,
          certificate.institution,
          "Times-Roman",
          23,
          15,
          width - 170,
        ),
      )
      .text(certificate.institution, 85, 124, {
        width: width - 170,
        align: "center",
        lineBreak: false,
      });
    document
      .font("Helvetica-Bold")
      .fillColor(gold)
      .fontSize(
        fitFontSize(
          document,
          certificate.certificateType.toUpperCase(),
          "Helvetica-Bold",
          9,
          6,
          width - 140,
        ),
      )
      .text(certificate.certificateType.toUpperCase(), 70, 159, {
        width: width - 140,
        align: "center",
        characterSpacing: 1.6,
      });
    document
      .font("Helvetica")
      .fillColor(muted)
      .fontSize(10)
      .text("This is proudly presented to", 70, 182, {
        width: width - 140,
        align: "center",
      });
    document
      .font("Times-Italic")
      .fillColor("#203b31")
      .fontSize(
        fitFontSize(
          document,
          certificate.studentName,
          "Times-Italic",
          34,
          23,
          width - 150,
        ),
      )
      .text(certificate.studentName, 75, 202, {
        width: width - 150,
        align: "center",
        lineBreak: false,
      });
    document
      .moveTo(center - 43, 251)
      .lineTo(center + 43, 251)
      .lineWidth(0.8)
      .stroke(gold);
    document
      .font("Helvetica")
      .fillColor(muted)
      .fontSize(10)
      .text("for the successful completion of", 70, 266, {
        width: width - 140,
        align: "center",
      });
    document
      .font("Times-Roman")
      .fillColor(ink)
      .fontSize(
        fitFontSize(
          document,
          certificate.course,
          "Times-Roman",
          23,
          15,
          width - 180,
        ),
      )
      .text(certificate.course, 90, 285, {
        width: width - 180,
        align: "center",
        lineBreak: false,
      });
    document
      .font("Helvetica")
      .fillColor(muted)
      .fontSize(9)
      .text(certificate.department, 90, 315, {
        width: width - 180,
        align: "center",
        lineBreak: false,
      });
    document
      .font("Helvetica-Bold")
      .fillColor(ink)
      .fontSize(9)
      .text(`ACADEMIC YEAR  ${certificate.academicYear}`, 90, 334, {
        width: width - 180,
        align: "center",
        characterSpacing: 0.5,
      });

    document
      .moveTo(61, 361)
      .lineTo(width - 61, 361)
      .lineWidth(0.7)
      .stroke("#d6c89f");

    document.image(qrBuffer, 77, 382, { fit: [106, 106] });
    document
      .font("Helvetica-Bold")
      .fillColor(muted)
      .fontSize(7)
      .text("SCAN TO VERIFY", 72, 493, {
        width: 116,
        align: "center",
        characterSpacing: 1,
      });

    drawMetadata(
      document,
      "CERTIFICATE ID",
      certificate.certificateId,
      218,
      382,
      220,
    );
    drawMetadata(
      document,
      "ISSUE DATE",
      new Date(certificate.issueDate).toLocaleDateString(),
      472,
      382,
      260,
    );
    drawMetadata(document, "ISSUED BY", certificate.issuerName, 218, 426, 220);
    drawMetadata(
      document,
      "ACADEMIC YEAR",
      certificate.academicYear,
      472,
      426,
      260,
    );
    document
      .font("Helvetica-Bold")
      .fillColor(muted)
      .fontSize(7)
      .text("BLOCKCHAIN TRANSACTION", 218, 472, { characterSpacing: 0.9 });
    document
      .font("Courier")
      .fillColor(ink)
      .fontSize(
        fitFontSize(
          document,
          certificate.blockchainTxHash || "Transaction not available",
          "Courier",
          8,
          6,
          width - 277,
        ),
      )
      .text(
        certificate.blockchainTxHash || "Transaction not available",
        218,
        486,
        {
          width: width - 277,
          lineBreak: false,
        },
      );

    if (certificate.status === "REVOKED") {
      document
        .font("Helvetica-Bold")
        .fillColor("#a7483d")
        .fontSize(8)
        .text("REVOKED RECORD", 218, 512, { characterSpacing: 1.2 });
    }

    document.end();
  });
}

function fitFontSize(
  document: InstanceType<typeof PDFDocument>,
  value: string,
  font: string,
  maxSize: number,
  minSize: number,
  maxWidth: number,
) {
  document.font(font);
  let size = maxSize;
  document.fontSize(size);
  while (size > minSize && document.widthOfString(value) > maxWidth) {
    size -= 0.5;
    document.fontSize(size);
  }
  return size;
}

function drawMetadata(
  document: InstanceType<typeof PDFDocument>,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
) {
  document
    .font("Helvetica-Bold")
    .fillColor("#718077")
    .fontSize(7)
    .text(label, x, y, { characterSpacing: 0.9 });
  document
    .font("Helvetica")
    .fillColor("#263a31")
    .fontSize(fitFontSize(document, value, "Helvetica", 10, 8, width))
    .text(value, x, y + 13, { width, lineBreak: false });
}
