import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  generatePrescription,
  generateLabReport,
  generateOpdSlip,
  generateInvoice,
  generateDischargeSummary,
  generateRadiologyReport,
  generateReferral,
  generateCertificate,
  generateEvidencePackPdf,
} from "../pdf";

const pdf = new Hono();

const TEMPLATES: Record<string, (id: string, opts: { lang?: string; watermark?: string }) => Promise<Buffer>> = {
  prescription: generatePrescription,
  "lab-report": generateLabReport,
  "opd-slip": generateOpdSlip,
  invoice: generateInvoice,
  "discharge-summary": generateDischargeSummary,
  "radiology-report": generateRadiologyReport,
  referral: generateReferral,
  certificate: generateCertificate,
  "evidence-pack": generateEvidencePackPdf,
};

const generateSchema = z.object({
  id: z.string().min(1),
  lang: z.string().optional().default("en"),
  watermark: z.string().optional(),
});

pdf.post("/:template", zValidator("json", generateSchema), async (c) => {
  const template = c.req.param("template");
  const { id, lang, watermark } = c.req.valid("json");

  const generator = TEMPLATES[template];
  if (!generator) return c.json({ error: `Unknown template: ${template}. Available: ${Object.keys(TEMPLATES).join(", ")}` }, 404);

  try {
    const buffer = await generator(id, { lang, watermark });

    return c.newResponse(new Uint8Array(buffer), 200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${template}-${id}.pdf"`,
      "Content-Length": String(buffer.length),
    });
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

pdf.get("/templates", (c) => {
  return c.json({
    templates: Object.keys(TEMPLATES),
    description: {
      prescription: "Prescription with drug list, dosage, frequency",
      "lab-report": "Lab test results with reference ranges",
      "opd-slip": "OPD visit summary slip",
      invoice: "Tax invoice with items and payment summary",
      "discharge-summary": "Full IPD discharge summary with diagnosis, vitals, meds",
      "radiology-report": "Radiology/imaging study report",
      referral: "Referral letter to another doctor/hospital",
      certificate: "Birth or death certificate from statutory register",
      "evidence-pack": "NABH audit evidence pack summary",
    },
  });
});

export default pdf;
