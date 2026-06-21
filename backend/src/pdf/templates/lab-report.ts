import { createDoc, header, footer, sectionTitle, kvRow, tableHeader, tableRow, toBuffer, type PdfOptions } from "../engine";
import { db } from "../../db";
import { labOrders, labTestCatalog, encounters, patients, staff } from "../../db/schema";
import { eq } from "drizzle-orm";
import { getFontName } from "../download-fonts";

export async function generateLabReport(
  orderId: string,
  options: PdfOptions = {},
): Promise<Buffer> {
  const doc = createDoc(options);
  const lang = options.lang || "en";
  const primaryFont = getFontName(lang);
  doc.font(primaryFont);

  const order = await db.query.labOrders.findFirst({
    where: eq(labOrders.id, orderId),
  });
  if (!order) throw new Error("Lab order not found");

  const test = await db.query.labTestCatalog.findFirst({
    where: eq(labTestCatalog.id, order.testId),
  });
  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, order.patientId),
  });
  const doctor = order.doctorId
    ? await db.query.staff.findFirst({ where: eq(staff.id, order.doctorId) })
    : null;

  header(doc, "LABORATORY REPORT", `Order: ${orderId}`);

  if (patient) {
    sectionTitle(doc, "Patient Information");
    kvRow(doc, "Name", patient.name);
    kvRow(doc, "Age / Sex", `${patient.age} / ${patient.sex}`);
    kvRow(doc, "UHID", patient.uhid);
    kvRow(doc, "Phone", patient.phone);
    doc.moveDown(0.3);
  }

  sectionTitle(doc, "Test Details");
  kvRow(doc, "Test Name", test?.name || "—");
  kvRow(doc, "Category", test?.category || "—");
  kvRow(doc, "Sample Type", test?.sampleType || "—");
  kvRow(doc, "Collected At", order.collectedAt?.toLocaleString() || "—");
  kvRow(doc, "Resulted At", order.resultedAt?.toLocaleString() || "—");
  kvRow(doc, "Status", order.status);
  doc.moveDown(0.3);

  if (order.result) {
    sectionTitle(doc, "Results");
    const params = Array.isArray(order.result) ? order.result : [order.result];
    const widths = [30, 150, 70, 70, 70];
    let y = tableHeader(doc, ["#", "Parameter", "Result", "Reference Range", "Flag"], widths);

    params.forEach((param: Record<string, unknown>, i: number) => {
      const val = String(param.value ?? param.result ?? "—");
      const flag = String(param.flag || (param.outOfRange ? "Abnormal" : "Normal"));
      y = tableRow(doc, [String(i + 1), String(param.name || param.parameter || "—"), val, String(param.reference || param.refRange || "—"), flag], widths, y);
    });
  }

  doc.moveDown(0.5);
  kvRow(doc, "Ordered by", doctor ? `${doctor.name} (${doctor.designation})` : "—");

  footer(doc);
  return toBuffer(doc);
}
