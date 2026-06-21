import { createDoc, header, footer, sectionTitle, kvRow, tableHeader, tableRow, toBuffer, type PdfOptions } from "../engine";
import { db } from "../../db";
import { nabhEvidencePacks } from "../../db/schema";
import { eq } from "drizzle-orm";
import { getFontName } from "../download-fonts";

export async function generateEvidencePackPdf(
  packId: string,
  options: PdfOptions = {},
): Promise<Buffer> {
  const doc = createDoc({ ...options, pageSize: "A4" });
  const lang = options.lang || "en";
  const primaryFont = getFontName(lang);
  doc.font(primaryFont);

  const pack = await db.query.nabhEvidencePacks.findFirst({
    where: eq(nabhEvidencePacks.id, packId),
  });
  if (!pack) throw new Error("Evidence pack not found");

  const data = pack.package as Record<string, unknown>;

  header(doc, `NABH EVIDENCE PACK`, `Status: ${pack.status} | Generated: ${pack.generatedAt.toLocaleString("en-IN")}`);

  if (data.summary) {
    const summary = data.summary as Record<string, unknown>;
    sectionTitle(doc, "Summary");
    for (const [k, v] of Object.entries(summary)) {
      const label = k.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim();
      kvRow(doc, label.charAt(0).toUpperCase() + label.slice(1), String(v));
    }
    doc.moveDown(0.3);
  }

  if (data.indicators && Array.isArray(data.indicators)) {
    sectionTitle(doc, "Quality Indicators");
    const widths = [100, 60, 60, 60, 60, 60];
    let y = tableHeader(doc, ["Indicator", "Target", "Rate", "Numerator", "Denominator", "Status"], widths);
    for (const ind of data.indicators) {
      const i = ind as Record<string, unknown>;
      y = tableRow(doc, [
        String(i.indicator || "—"),
        String(i.targetRate || "—"),
        String(i.rate || "—"),
        String(i.numerator || "—"),
        String(i.denominator || "—"),
        String(i.status || "—"),
      ], widths, y);
    }
    doc.moveDown(0.3);
  }

  if (data.committeeReports && Array.isArray(data.committeeReports)) {
    sectionTitle(doc, "Committee Reports");
    for (const cr of data.committeeReports) {
      const c = cr as Record<string, unknown>;
      doc.fontSize(9).text(`• ${c.committee} — ${String(c.meetingDate || "")}`);
      const attArr = c.attendees as unknown[] || [];
      doc.fontSize(8).fillColor("#666").text(`  Chair: ${c.chairperson || "—"} | ${attArr.length} attendees`).fillColor("#000");
    }
    doc.moveDown(0.3);
  }

  if (data.statutoryRegisters && Array.isArray(data.statutoryRegisters)) {
    sectionTitle(doc, "Statutory Registers");
    const widths = [40, 70, 100, 80];
    let y = tableHeader(doc, ["Type", "Reg #", "Patient", "Date"], widths);
    for (const reg of data.statutoryRegisters) {
      const r = reg as Record<string, unknown>;
      y = tableRow(doc, [
        String(r.type || "—"),
        String(r.registerNumber || "—"),
        String(r.patientName || "—"),
        String(r.recordedAt ? new Date(String(r.recordedAt)).toLocaleDateString("en-IN") : "—"),
      ], widths, y);
    }
  }

  footer(doc);
  return toBuffer(doc);
}
