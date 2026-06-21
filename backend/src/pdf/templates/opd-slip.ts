import { createDoc, header, footer, sectionTitle, kvRow, toBuffer, type PdfOptions } from "../engine";
import { db } from "../../db";
import { encounters, patients, staff } from "../../db/schema";
import { eq } from "drizzle-orm";
import { getFontName } from "../download-fonts";

export async function generateOpdSlip(
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

  header(doc, "OPD SLIP", `Visit: ${encounterId}`);

  if (patient) {
    sectionTitle(doc, "Patient Information");
    kvRow(doc, "Name", patient.name);
    kvRow(doc, "Age / Sex", `${patient.age} / ${patient.sex}`);
    kvRow(doc, "UHID", patient.uhid);
    kvRow(doc, "Phone", patient.phone);
    doc.moveDown(0.3);
  }

  sectionTitle(doc, "Visit Details");
  kvRow(doc, "Department", encounter.department);
  kvRow(doc, "Doctor", doctor ? `${doctor.name} (${doctor.designation})` : "—");
  kvRow(doc, "Date & Time", encounter.datetime.toLocaleString("en-IN"));
  kvRow(doc, "Type", encounter.type);
  kvRow(doc, "Chief Complaint", encounter.chiefComplaint || "—");
  doc.moveDown(0.3);

  sectionTitle(doc, "Notes");
  doc.fontSize(9).text(encounter.notes || "No notes recorded.", { width: doc.page.width - 100 });
  doc.moveDown(1);

  footer(doc);
  return toBuffer(doc);
}
