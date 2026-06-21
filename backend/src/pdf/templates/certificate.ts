import { createDoc, header, footer, sectionTitle, kvRow, toBuffer, type PdfOptions } from "../engine";
import { db } from "../../db";
import { nabhRegisters, patients, staff } from "../../db/schema";
import { eq } from "drizzle-orm";
import { getFontName } from "../download-fonts";

export async function generateCertificate(
  registerId: string,
  options: PdfOptions = {},
): Promise<Buffer> {
  const doc = createDoc(options);
  const lang = options.lang || "en";
  const primaryFont = getFontName(lang);
  doc.font(primaryFont);

  const reg = await db.query.nabhRegisters.findFirst({
    where: eq(nabhRegisters.id, registerId),
  });
  if (!reg) throw new Error("Register entry not found");

  const title = reg.type === "birth" ? "BIRTH CERTIFICATE" : "DEATH CERTIFICATE";
  header(doc, title, `Register #${reg.registerNumber}`);

  sectionTitle(doc, "Certificate Details");
  kvRow(doc, "Register Number", reg.registerNumber!);
  kvRow(doc, "Patient Name", reg.patientName || "—");
  kvRow(doc, "Recorded By", reg.recordedBy);
  kvRow(doc, "Recorded At", reg.recordedAt.toLocaleString("en-IN"));

  if (reg.notifiedTo) {
    kvRow(doc, "Notified To", reg.notifiedTo);
    kvRow(doc, "Notification Date", reg.notificationDate || "—");
  }
  doc.moveDown(0.3);

  sectionTitle(doc, "Details");
  const details = reg.details as Record<string, unknown>;
  for (const [key, value] of Object.entries(details)) {
    kvRow(doc, key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()), String(value));
  }

  footer(doc);
  return toBuffer(doc);
}
