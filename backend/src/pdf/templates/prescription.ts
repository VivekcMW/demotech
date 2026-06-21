import { createDoc, header, footer, sectionTitle, kvRow, tableHeader, tableRow, warningBox, toBuffer, type PdfOptions } from "../engine";
import { db } from "../../db";
import { prescriptions, rxItems, encounters, patients, staff } from "../../db/schema";
import { eq } from "drizzle-orm";
import { getFontName } from "../download-fonts";

export async function generatePrescription(
  encounterId: string,
  options: PdfOptions = {},
): Promise<Buffer> {
  const doc = createDoc(options);
  const lang = options.lang || "en";
  const primaryFont = getFontName(lang);
  doc.font(primaryFont);

  const encounter = await db.query.encounters.findFirst({
    where: eq(encounters.id, encounterId),
  });
  if (!encounter) throw new Error("Encounter not found");

  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, encounter.patientId),
  });
  const doctor = encounter.doctorId
    ? await db.query.staff.findFirst({ where: eq(staff.id, encounter.doctorId) })
    : null;

  const rxList = await db.query.prescriptions.findMany({
    where: eq(prescriptions.encounterId, encounterId),
  });

  const rxItemList = rxList.length > 0
    ? await db.query.rxItems.findMany({
        where: eq(rxItems.prescriptionId, rxList[0].id),
      })
    : [];

  header(doc, "PRESCRIPTION", `Encounter: ${encounterId} | ${encounter.department}`);

  if (patient) {
    sectionTitle(doc, "Patient Information");
    kvRow(doc, "Name", patient.name);
    kvRow(doc, "Age / DOB", `${patient.age} / ${patient.dob}`);
    kvRow(doc, "Sex", patient.sex);
    kvRow(doc, "UHID", patient.uhid);
    kvRow(doc, "Phone", patient.phone);
    doc.moveDown(0.5);
  }

  sectionTitle(doc, "Prescription");
  doc.moveDown(0.3);

  if (rxItemList.length === 0) {
    doc.fontSize(9).fillColor("#666").text("No medications prescribed.").fillColor("#000");
  } else {
    const widths = [50, 140, 60, 60, 60, 60];
    let y = tableHeader(doc, ["#", "Drug", "Dosage", "Route", "Frequency", "Duration"], widths);
    rxItemList.forEach((item, i) => {
      y = tableRow(doc, [
        String(i + 1), item.drugName, item.dosage,
        item.route || "—", item.frequency, item.duration || "—",
      ], widths, y);
    });
  }

  doc.moveDown(1);
  warningBox(doc, "This is a computer-generated prescription. No signature required per IPC Section 5.");

  doc.font(primaryFont);
  if (doctor) {
    doc.moveDown(0.5);
    kvRow(doc, "Prescribed by", `${doctor.name} (${doctor.designation})`);
  }
  kvRow(doc, "Date", new Date().toLocaleString("en-IN"));

  footer(doc);
  if (options.watermark) renderWatermark(doc, options.watermark);

  return toBuffer(doc);
}

function renderWatermark(doc: PDFKit.PDFDocument, text: string): void {
  for (let i = 0; i < doc.bufferedPageRange().count; i++) {
    doc.switchToPage(i);
    doc.save();
    doc.fontSize(60).fillColor("#ddd").rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
    doc.text(text, doc.page.width / 2 - 150, doc.page.height / 2 - 30, { align: "center" });
    doc.restore();
  }
}
