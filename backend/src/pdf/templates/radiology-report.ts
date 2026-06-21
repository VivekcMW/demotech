import { createDoc, header, footer, sectionTitle, kvRow, toBuffer, type PdfOptions } from "../engine";
import { db } from "../../db";
import { imagingStudies, encounters, patients, staff } from "../../db/schema";
import { eq } from "drizzle-orm";
import { getFontName } from "../download-fonts";

export async function generateRadiologyReport(
  studyId: string,
  options: PdfOptions = {},
): Promise<Buffer> {
  const doc = createDoc(options);
  const lang = options.lang || "en";
  const primaryFont = getFontName(lang);
  doc.font(primaryFont);

  const study = await db.query.imagingStudies.findFirst({
    where: eq(imagingStudies.id, studyId),
  });
  if (!study) throw new Error("Imaging study not found");

  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, study.patientId),
  });
  const radiologist = study.radiologistId
    ? await db.query.staff.findFirst({ where: eq(staff.id, study.radiologistId) })
    : null;

  header(doc, "RADIOLOGY REPORT", `Study: ${studyId}`);

  if (patient) {
    sectionTitle(doc, "Patient Information");
    kvRow(doc, "Name", patient.name);
    kvRow(doc, "Age / Sex", `${patient.age} / ${patient.sex}`);
    kvRow(doc, "UHID", patient.uhid);
    doc.moveDown(0.3);
  }

  sectionTitle(doc, "Study Details");
  kvRow(doc, "Modality", study.modality || "—");
  kvRow(doc, "Description", study.description || "—");
  kvRow(doc, "Study UID", study.studyUid || "—");
  kvRow(doc, "Series Count", String(study.seriesCount || "—"));
  kvRow(doc, "Status", study.status);
  doc.moveDown(0.3);

  sectionTitle(doc, "Report");
  doc.fontSize(9).text(study.report || "No report available.", { width: doc.page.width - 100 });
  doc.moveDown(1);

  if (radiologist) {
    kvRow(doc, "Reported by", `${radiologist.name} (${radiologist.designation})`);
  }

  footer(doc);
  return toBuffer(doc);
}
