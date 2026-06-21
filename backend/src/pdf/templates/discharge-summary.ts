import { createDoc, header, footer, sectionTitle, kvRow, toBuffer, type PdfOptions } from "../engine";
import { db } from "../../db";
import { encounters, patients, staff, diagnoses, vitals, labOrders, prescriptions, rxItems } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { getFontName } from "../download-fonts";

export async function generateDischargeSummary(
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

  const vitalsList = await db.query.vitals.findMany({
    where: eq(vitals.encounterId, encounterId),
    orderBy: [desc(vitals.recordedAt)],
    limit: 5,
  });

  const labOrderList = await db.query.labOrders.findMany({
    where: eq(labOrders.encounterId, encounterId),
    limit: 20,
  });

  const rxList = await db.query.prescriptions.findMany({
    where: eq(prescriptions.encounterId, encounterId),
  });

  header(doc, "DISCHARGE SUMMARY", `Encounter: ${encounterId}`);

  if (patient) {
    sectionTitle(doc, "Patient Information");
    kvRow(doc, "Name", patient.name);
    kvRow(doc, "Age / DOB", `${patient.age} / ${patient.dob}`);
    kvRow(doc, "Sex", patient.sex);
    kvRow(doc, "UHID", patient.uhid);
    kvRow(doc, "Phone", patient.phone);
    kvRow(doc, "Blood Group", patient.bloodGroup);
    doc.moveDown(0.3);
  }

  sectionTitle(doc, "Admission Details");
  kvRow(doc, "Department", encounter.department);
  kvRow(doc, "Doctor", doctor ? `${doctor.name} (${doctor.designation})` : "—");
  kvRow(doc, "Admitted On", encounter.datetime.toLocaleString("en-IN"));
  kvRow(doc, "Chief Complaint", encounter.chiefComplaint || "—");
  doc.moveDown(0.3);

  sectionTitle(doc, "Diagnosis");
  if (dxList.length === 0) {
    doc.fontSize(9).fillColor("#666").text(encounter.diagnosis || "No diagnosis recorded.").fillColor("#000");
  } else {
    dxList.forEach((dx, i) => {
      doc.fontSize(9).text(`${i + 1}. [${dx.icdCode}] ${dx.description} (${dx.type})`);
    });
  }
  doc.moveDown(0.3);

  if (vitalsList.length > 0) {
    sectionTitle(doc, "Vitals (Last Recorded)");
    const last = vitalsList[0];
    kvRow(doc, "BP", last.bpSystolic && last.bpDiastolic ? `${last.bpSystolic}/${last.bpDiastolic} mmHg` : "—");
    kvRow(doc, "HR", last.hr ? `${last.hr} bpm` : "—");
    kvRow(doc, "Temp", last.temp ? `${last.temp}°F` : "—");
    kvRow(doc, "SpO2", last.spo2 ? `${last.spo2}%` : "—");
    kvRow(doc, "RR", last.rr ? `${last.rr} /min` : "—");
    doc.moveDown(0.3);
  }

  if (labOrderList.length > 0) {
    sectionTitle(doc, "Investigations");
    labOrderList.forEach((lo) => {
      doc.fontSize(8).text(`• ${lo.testId} — Status: ${lo.status}`);
    });
    doc.moveDown(0.3);
  }

  if (rxList.length > 0) {
    sectionTitle(doc, "Medications at Discharge");
    for (const rx of rxList) {
      const items = await db.query.rxItems.findMany({
        where: eq(rxItems.prescriptionId, rx.id),
      });
      items.forEach((item) => {
        doc.fontSize(8).text(`• ${item.drugName} ${item.dosage} ${item.frequency} (${item.route || "—"})`);
      });
    }
    doc.moveDown(0.3);
  }

  sectionTitle(doc, "Discharge Notes");
  doc.fontSize(9).text(encounter.notes || "No discharge notes recorded.", { width: doc.page.width - 100 });

  doc.moveDown(1);
  if (doctor) {
    kvRow(doc, "Discharged by", `${doctor.name} (${doctor.designation})`);
  }

  footer(doc);
  return toBuffer(doc);
}
