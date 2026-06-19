import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db, schema } from "../db";
import { eq, desc } from "drizzle-orm";

const clinical = new Hono();

// ── Specialty JSONB record access ─────────────────────────────────────────

clinical.get("/obgyn/:patientId", async (c) => {
  const result = await db.select().from(schema.obgynRecords)
    .where(eq(schema.obgynRecords.patientId, c.req.param("patientId")))
    .orderBy(desc(schema.obgynRecords.createdAt)).limit(10);
  return c.json({ data: result });
});

clinical.get("/ecg/:patientId", async (c) => {
  const result = await db.select().from(schema.ecgRecords)
    .where(eq(schema.ecgRecords.patientId, c.req.param("patientId")))
    .orderBy(desc(schema.ecgRecords.createdAt)).limit(10);
  return c.json({ data: result });
});

clinical.get("/pft/:patientId", async (c) => {
  const result = await db.select().from(schema.pftRecords)
    .where(eq(schema.pftRecords.patientId, c.req.param("patientId")))
    .orderBy(desc(schema.pftRecords.createdAt)).limit(10);
  return c.json({ data: result });
});

clinical.get("/nephrology/:patientId", async (c) => {
  const result = await db.select().from(schema.nephrologyRecords)
    .where(eq(schema.nephrologyRecords.patientId, c.req.param("patientId")))
    .orderBy(desc(schema.nephrologyRecords.createdAt)).limit(10);
  return c.json({ data: result });
});

clinical.get("/cardiology/:patientId", async (c) => {
  const result = await db.select().from(schema.cardioRecords)
    .where(eq(schema.cardioRecords.patientId, c.req.param("patientId")))
    .orderBy(desc(schema.cardioRecords.createdAt)).limit(10);
  return c.json({ data: result });
});

clinical.get("/oncology/:patientId", async (c) => {
  const result = await db.select().from(schema.oncologyRecords)
    .where(eq(schema.oncologyRecords.patientId, c.req.param("patientId")))
    .orderBy(desc(schema.oncologyRecords.createdAt)).limit(10);
  return c.json({ data: result });
});

// ── Clinical Calculators (pure functions) ─────────────────────────────────

const abgSchema = z.object({
  pH: z.number().min(6.5).max(8),
  pCO2: z.number().min(10).max(150),
  pO2: z.number().min(20).max(700),
  HCO3: z.number().min(5).max(60),
  BE: z.number().min(-30).max(30),
  FiO2: z.number().min(0.21).max(1).optional(),
});

clinical.post("/calculate/abg", zValidator("json", abgSchema), (c) => {
  const { pH, pCO2, pO2, HCO3, BE, FiO2 } = c.req.valid("json");

  // Acid-base classification
  let primary: string;
  if (pH < 7.35) {
    primary = pCO2 > 45 ? "Respiratory Acidosis" : HCO3 < 22 ? "Metabolic Acidosis" : "Mixed Acidosis";
  } else if (pH > 7.45) {
    primary = pCO2 < 35 ? "Respiratory Alkalosis" : HCO3 > 26 ? "Metabolic Alkalosis" : "Mixed Alkalosis";
  } else {
    primary = "Normal / Compensated";
  }

  // Compensation
  let compensation = "None";
  if (pH >= 7.35 && pH <= 7.45 && (pCO2 > 45 || pCO2 < 35 || HCO3 < 22 || HCO3 > 26)) {
    compensation = "Fully Compensated";
  } else if ((pH < 7.35 && (pCO2 > 45 || HCO3 < 22)) || (pH > 7.45 && (pCO2 < 35 || HCO3 > 26))) {
    compensation = "Partially Compensated";
  }

  // Oxygenation
  const pfRatio = FiO2 ? Math.round(pO2 / FiO2) : null;
  let oxygenation = "Normal";
  if (pfRatio !== null) {
    if (pfRatio < 100) oxygenation = "Severe Hypoxemia (ARDS)";
    else if (pfRatio < 200) oxygenation = "Moderate Hypoxemia";
    else if (pfRatio < 300) oxygenation = "Mild Hypoxemia";
  }

  return c.json({
    primary,
    compensation,
    oxygenation: pfRatio !== null ? `${oxygenation} (P/F: ${pfRatio})` : oxygenation,
    details: { pH, pCO2, pO2, HCO3, BE, pfRatio },
  });
});

const das28Schema = z.object({
  tender28: z.number().min(0).max(28),
  swollen28: z.number().min(0).max(28),
  patientGlobal: z.number().min(0).max(100),
  esr: z.number().min(1).max(150),
});

clinical.post("/calculate/das28", zValidator("json", das28Schema), (c) => {
  const { tender28, swollen28, patientGlobal, esr } = c.req.valid("json");
  const score = Math.round((0.56 * Math.sqrt(tender28) + 0.28 * Math.sqrt(swollen28) + 0.7 * Math.log(esr + 1) + 0.014 * patientGlobal) * 100) / 100;
  const diseaseActivity = score <= 2.6 ? "Remission" : score <= 3.2 ? "Low" : score <= 5.1 ? "Moderate" : "High";
  return c.json({ score, diseaseActivity, remission: score <= 2.6 });
});

const ipssSchema = z.object({
  answers: z.array(z.number().min(0).max(5)).length(7),
});

clinical.post("/calculate/ipss", zValidator("json", ipssSchema), (c) => {
  const { answers } = c.req.valid("json");
  const score = answers.reduce((a, b) => a + b, 0);
  const severity = score <= 7 ? "Mild" : score <= 19 ? "Moderate" : "Severe";
  return c.json({ score, severity, interpretation: `IPSS ${score}/35 — ${severity} symptoms` });
});

const qsofaSchema = z.object({
  rr: z.number().min(0),
  sbp: z.number().min(0),
  loc: z.boolean(),
});

clinical.post("/calculate/qsofa", zValidator("json", qsofaSchema), (c) => {
  const { rr, sbp, loc } = c.req.valid("json");
  const score = (rr >= 22 ? 1 : 0) + (sbp <= 100 ? 1 : 0) + (loc ? 1 : 0);
  return c.json({
    score,
    risk: score >= 2 ? "HIGH — Suspect sepsis, escalate immediately" : "Low",
    components: { rr: rr >= 22, sbp: sbp <= 100, loc },
  });
});

const newsSchema = z.object({
  rr: z.number(), spo2: z.number(), o2: z.boolean(),
  sbp: z.number(), hr: z.number(), temp: z.number(), loc: z.boolean(),
});

clinical.post("/calculate/news", zValidator("json", newsSchema), (c) => {
  const input = c.req.valid("json");
  let score = 0;
  if (input.rr <= 8 || input.rr >= 25) score += 3; else if (input.rr >= 21) score += 2;
  if (input.spo2 <= 91) score += 3; else if (input.spo2 <= 93) score += 2; else if (input.spo2 <= 95) score += 1;
  if (input.o2) score += 2;
  if (input.sbp <= 90 || input.sbp >= 220) score += 3; else if (input.sbp <= 100) score += 2; else if (input.sbp <= 110) score += 1;
  if (input.hr <= 40 || input.hr >= 131) score += 3; else if (input.hr >= 111) score += 2; else if (input.hr >= 91) score += 1;
  if (input.loc) score += 3;
  if (input.temp <= 35) score += 3; else if (input.temp >= 39.1) score += 2; else if (input.temp >= 38.1) score += 1;

  return c.json({
    score,
    risk: score >= 7 ? "HIGH — Urgent ICU review" : score >= 5 ? "MEDIUM — Urgent ward review" : score >= 3 ? "LOW — Regular monitoring" : "NORMAL",
  });
});

const ktvSchema = z.object({
  preUrea: z.number().positive(),
  postUrea: z.number().positive(),
  dialyzerK: z.number().positive(),
  treatmentTime: z.number().positive(), // hours
  weight: z.number().positive(),
  ultrafiltration: z.number(),           // mL
});

clinical.post("/calculate/ktv", zValidator("json", ktvSchema), (c) => {
  const { preUrea, postUrea, dialyzerK, treatmentTime, weight, ultrafiltration } = c.req.valid("json");

  // Daugirdas II
  const rr = postUrea / preUrea;
  const ktV = -Math.log(rr - 0.008 * treatmentTime) + (4 - 3.5 * rr) * (ultrafiltration / 1000 / weight);
  const urr = (1 - rr) * 100;

  return c.json({
    ktV: Math.round(ktV * 100) / 100,
    urr: Math.round(urr * 10) / 10,
    adequate: ktV >= 1.2,
  });
});

const pasiSchema = z.object({
  regions: z.array(z.object({
    area: z.number().min(0).max(100),
    erythema: z.number().min(0).max(4),
    scaling: z.number().min(0).max(4),
    thickness: z.number().min(0).max(4),
  })).length(4),
});

clinical.post("/calculate/pasi", zValidator("json", pasiSchema), (c) => {
  const { regions } = c.req.valid("json");
  const weights = [0.1, 0.2, 0.3, 0.4]; // head, arms, trunk, legs
  const total = regions.reduce((sum, r, i) => {
    return sum + weights[i] * (r.erythema + r.scaling + r.thickness) * (r.area / 100);
  }, 0);
  const score = Math.round(total * 100) / 100;
  const severity = score < 5 ? "Mild" : score < 10 ? "Moderate" : score < 15 ? "Severe" : "Very Severe";
  return c.json({ score, severity });
});

// ── Drug Interaction Checker ─────────────────────────────────────────────

const interactionSchema = z.object({
  drugs: z.array(z.string()).min(2).max(15),
});

// In-memory interaction data (transferred from frontend)
const INTERACTIONS: { drugA: string; drugB: string; severity: string; effect: string; mechanism: string; recommendation: string }[] = [
  { drugA: "Warfarin", drugB: "Aspirin", severity: "Contraindicated", effect: "Increased bleeding risk", mechanism: "Synergistic anticoagulation", recommendation: "Avoid combination. Use alternative analgesia." },
  { drugA: "Warfarin", drugB: "Clarithromycin", severity: "Contraindicated", effect: "Severe INR elevation, bleeding", mechanism: "CYP450 inhibition reduces warfarin metabolism", recommendation: "Switch antibiotic or monitor INR daily." },
  { drugA: "ACE Inhibitors", drugB: "Spironolactone", severity: "Severe", effect: "Severe hyperkalemia", mechanism: "Dual blockade of RAAS", recommendation: "Monitor K+ closely; consider alternate diuretic." },
  { drugA: "Metformin", drugB: "Contrast Dye", severity: "Severe", effect: "Lactic acidosis risk", mechanism: "Renal impairment from contrast", recommendation: "Hold metformin 48h before and after contrast." },
  { drugA: "Digoxin", drugB: "Amiodarone", severity: "Severe", effect: "Digoxin toxicity", mechanism: "Reduced digoxin clearance", recommendation: "Reduce digoxin dose by 50%; monitor levels." },
  { drugA: "Clopidogrel", drugB: "Omeprazole", severity: "Moderate", effect: "Reduced antiplatelet efficacy", mechanism: "CYP2C19 inhibition", recommendation: "Use pantoprazole instead of omeprazole." },
  { drugA: "Lithium", drugB: "NSAIDs", severity: "Severe", effect: "Lithium toxicity", mechanism: "Reduced renal lithium clearance", recommendation: "Monitor lithium levels; use alternative analgesia." },
  { drugA: "Theophylline", drugB: "Ciprofloxacin", severity: "Severe", effect: "Theophylline toxicity", mechanism: "CYP450 inhibition", recommendation: "Reduce theophylline dose; monitor levels." },
  { drugA: "SSRIs", drugB: "MAOIs", severity: "Contraindicated", effect: "Serotonin syndrome", mechanism: "Excessive serotonin activity", recommendation: "14-day washout between switches." },
  { drugA: "Statins", drugB: "Azole Antifungals", severity: "Moderate", effect: "Increased myopathy risk", mechanism: "CYP3A4 inhibition", recommendation: "Monitor for muscle pain; consider statin dose reduction." },
];

clinical.post("/drug-interactions", zValidator("json", interactionSchema), (c) => {
  const { drugs } = c.req.valid("json");
  const found = INTERACTIONS.filter(
    (i) => drugs.includes(i.drugA) && drugs.includes(i.drugB)
  );
  return c.json({
    interactions: found,
    count: found.length,
    hasContraindicated: found.some((i) => i.severity === "Contraindicated"),
  });
});

export default clinical;
