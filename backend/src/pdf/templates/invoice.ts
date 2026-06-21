import { createDoc, header, footer, sectionTitle, kvRow, tableHeader, tableRow, toBuffer, type PdfOptions } from "../engine";
import { db } from "../../db";
import { billing, claims, patients } from "../../db/schema";
import { eq } from "drizzle-orm";
import { getFontName } from "../download-fonts";

export async function generateInvoice(
  billId: string,
  options: PdfOptions = {},
): Promise<Buffer> {
  const doc = createDoc(options);
  const lang = options.lang || "en";
  const primaryFont = getFontName(lang);
  doc.font(primaryFont);

  const bill = await db.query.billing.findFirst({
    where: eq(billing.id, billId),
  });
  if (!bill) throw new Error("Bill not found");

  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, bill.patientId),
  });
  const claim = await db.query.claims.findFirst({
    where: eq(claims.billId, billId),
  });

  header(doc, "TAX INVOICE", `Bill No: ${billId}`);

  if (patient) {
    sectionTitle(doc, "Patient Information");
    kvRow(doc, "Name", patient.name);
    kvRow(doc, "UHID", patient.uhid);
    kvRow(doc, "Address", patient.address || "—");
    kvRow(doc, "Phone", patient.phone);
    doc.moveDown(0.3);
  }

  sectionTitle(doc, "Invoice Summary");
  kvRow(doc, "Bill Date", bill.createdAt.toLocaleString("en-IN"));
  kvRow(doc, "Status", bill.status);
  kvRow(doc, "Payment Mode", bill.paymentMode || "—");
  doc.moveDown(0.3);

  if (bill.items && Array.isArray(bill.items) && bill.items.length > 0) {
    sectionTitle(doc, "Bill Items");
    const widths = [30, 200, 60, 60, 70];
    let y = tableHeader(doc, ["#", "Item", "Qty", "Rate", "Amount"], widths);
    let serial = 1;
    for (const item of bill.items) {
      const i = item as Record<string, unknown>;
      y = tableRow(doc, [
        String(serial++),
        String(i.name || i.description || "—"),
        String(i.quantity || i.qty || "1"),
        String(i.rate || i.price || "0"),
        String(i.amount || i.total || "0"),
      ], widths, y);
    }
  }

  doc.moveDown(0.5);
  sectionTitle(doc, "Payment Summary");
  const summaryWidths = [200, 100];
  let sy = tableHeader(doc, ["Description", "Amount (₹)"], summaryWidths);
  sy = tableRow(doc, ["Total", String(bill.total)], summaryWidths, sy);
  sy = tableRow(doc, ["Discount", `-${bill.discount}`], summaryWidths, sy);
  sy = tableRow(doc, ["Net Amount", String(bill.netAmount)], summaryWidths, sy);
  sy = tableRow(doc, ["Paid", String(bill.paid)], summaryWidths, sy);
  sy = tableRow(doc, ["Balance", String(bill.balance)], summaryWidths, sy);

  doc.moveDown(0.5);
  if (claim) {
    sectionTitle(doc, "Insurance / TPA");
    kvRow(doc, "Insurer", claim.insurer);
    kvRow(doc, "Policy No", claim.policyNo || "—");
    kvRow(doc, "Claimed Amount", String(claim.claimedAmount || "—"));
    kvRow(doc, "Approved Amount", String(claim.approvedAmount || "—"));
    kvRow(doc, "Status", claim.status);
  }

  footer(doc);
  return toBuffer(doc);
}
