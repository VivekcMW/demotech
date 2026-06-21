import { createDoc, header, footer, sectionTitle, kvRow, toBuffer, type PdfOptions } from "../engine";
import { db } from "../../db";
import { encounters, patients, staff, diagnoses } from "../../db/schema";
import { eq } from "drizzle-orm";
import { getFontName } from "../download-fonts";

export async function generateReferral(
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

  const dxList = await db.query.diagnoses.findMany({
    where: eq(diagnoses.encounterId, encounterId),
  });

  header(doc, "REFERRAL LETTER", `Encounter: ${encounterId}`);

  if (patient) {
    sectionTitle(doc, "Patient Information");
    kvRow(doc, "Name", patient.name);
    kvRow(doc, "Age / Sex", `${patient.age} / ${patient.sex}`);
    kvRow(doc, "UHID", patient.uhid);
    doc.moveDown(0.3);
  }

  sectionTitle(doc, "Referring Details");
  kvRow(doc, "Referring Doctor", doctor ? `${doctor.name} (${doctor.designation})` : "—");
  kvRow(doc, "Department", encounter.department);
  kvRow(doc, "Date", encounter.datetime.toLocaleString("en-IN"));
  doc.moveDown(0.3);

  sectionTitle(doc, "Diagnosis");
  if (dxList.length > 0) {
    dxList.forEach((dx, i) => {
      doc.fontSize(9).text(`${i + 1}. [${dx.icdCode}] ${dx.description}`);
    });
  } else {
    doc.fontSize(9).text(encounter.diagnosis || "No diagnosis recorded.");
  }
  doc.moveDown(0.3);

  sectionTitle(doc, "Reason for Referral");
  doc.fontSize(9).text(encounter.notes || "No referral notes.", { width: doc.page.width - 100 });

  footer(doc);
  return toBuffer(doc);
}
