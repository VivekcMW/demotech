import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { nabhIndicatorDefinitions, nabhIndicatorValues } from "../db/schema";
import { eq, and } from "drizzle-orm";
import {
  NABH_INDICATOR_DEFINITIONS,
  computeIndicator,
  computeAllIndicators,
  saveIndicatorValues,
  createRegisterEntry,
  queryRegisters,
  getRegisterStats,
  getRegisterById,
  createCommitteeReport,
  updateCommitteeReport,
  queryCommitteeReports,
  getCommitteeReportById,
  getCommitteeStats,
  COMMITTEE_TYPES,
  generateEvidencePack,
  finalizeEvidencePack,
  queryEvidencePacks,
  getEvidencePackById,
  exportEvidencePack,
} from "../nabh";

const nabh = new Hono();

// ── Seed indicator definitions ──────────────────────────────────────────

nabh.post("/definitions/seed", async (c) => {
  let count = 0;
  for (const def of NABH_INDICATOR_DEFINITIONS) {
    const existing = await db.query.nabhIndicatorDefinitions.findFirst({
      where: eq(nabhIndicatorDefinitions.id, def.id),
    });
    if (!existing) {
      await db.insert(nabhIndicatorDefinitions).values({
        id: def.id,
        name: def.name,
        category: def.category,
        nabhStandard: def.nabhStandard,
        description: def.description,
        numeratorDesc: def.numeratorDesc,
        denominatorDesc: def.denominatorDesc,
        targetRate: def.targetRate !== undefined ? String(def.targetRate) : null,
        computationType: def.computationType,
        dataSource: def.dataSource,
      });
      count++;
    }
  }
  return c.json({ seeded: count, total: NABH_INDICATOR_DEFINITIONS.length });
});

// ── Indicator definitions ───────────────────────────────────────────────

nabh.get("/definitions", async (c) => {
  const defs = await db.query.nabhIndicatorDefinitions.findMany({
    orderBy: (d, { asc }) => [asc(d.category), asc(d.name)],
  });
  return c.json(defs);
});

nabh.get("/definitions/:id", async (c) => {
  const id = c.req.param("id");
  const def = await db.query.nabhIndicatorDefinitions.findFirst({
    where: eq(nabhIndicatorDefinitions.id, id),
  });
  if (!def) return c.json({ error: "Indicator definition not found" }, 404);
  return c.json(def);
});

// ── Indicator computation ───────────────────────────────────────────────

const computeSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  periodType: z.enum(["daily", "weekly", "monthly", "quarterly"]),
  department: z.string().optional(),
});

nabh.post("/indicators/compute/:id", zValidator("json", computeSchema), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");

  try {
    const result = await computeIndicator(id, body);
    await saveIndicatorValues([{ indicatorId: id, ...result }], body);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

nabh.post("/indicators/compute-all", zValidator("json", computeSchema), async (c) => {
  const body = c.req.valid("json");

  try {
    const results = await computeAllIndicators(body);
    await saveIndicatorValues(results, body);
    return c.json({ computed: results.length, results });
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

const manualIndicatorSchema = z.object({
  indicatorId: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  periodType: z.enum(["daily", "weekly", "monthly", "quarterly"]),
  numerator: z.number(),
  denominator: z.number(),
  department: z.string().optional(),
});

nabh.post("/indicators/manual", zValidator("json", manualIndicatorSchema), async (c) => {
  const body = c.req.valid("json");
  const rate = body.denominator > 0 ? Number(((body.numerator / body.denominator) * 100).toFixed(2)) : 0;

  await saveIndicatorValues(
    [{ indicatorId: body.indicatorId, numerator: body.numerator, denominator: body.denominator, rate }],
    body,
  );

  return c.json({ indicatorId: body.indicatorId, numerator: body.numerator, denominator: body.denominator, rate }, 201);
});

// ── Indicator values ────────────────────────────────────────────────────

nabh.get("/indicators/values", async (c) => {
  const indicatorId = c.req.query("indicatorId");
  const periodStart = c.req.query("periodStart");
  const periodEnd = c.req.query("periodEnd");
  const department = c.req.query("department");

  const conditions = [];
  if (indicatorId) conditions.push(eq(nabhIndicatorValues.indicatorId, indicatorId));
  if (department) conditions.push(eq(nabhIndicatorValues.department, department));

  const values = await db.query.nabhIndicatorValues.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: (v, { desc }) => [desc(v.computedAt)],
    limit: 100,
  });

  return c.json(values);
});

// ── Statutory Registers ─────────────────────────────────────────────────

const registerSchema = z.object({
  type: z.enum(["birth", "death", "notifiable_disease", "pcpndt"]),
  patientId: z.string().optional(),
  encounterId: z.string().optional(),
  patientName: z.string().optional(),
  recordedBy: z.string(),
  details: z.record(z.unknown()),
  notifiedTo: z.string().optional(),
  notificationDate: z.string().optional(),
});

nabh.post("/registers", zValidator("json", registerSchema), async (c) => {
  const body = c.req.valid("json");
  const result = await createRegisterEntry(body);
  return c.json(result, 201);
});

nabh.get("/registers", async (c) => {
  const type = c.req.query("type");
  const patientId = c.req.query("patientId");
  const fromDate = c.req.query("fromDate");
  const toDate = c.req.query("toDate");
  const page = c.req.query("page") ? Number(c.req.query("page")) : 1;
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 50;

  const result = await queryRegisters({ type, patientId, fromDate, toDate, page, limit });
  return c.json(result);
});

nabh.get("/registers/stats", async (c) => {
  const fromDate = c.req.query("fromDate");
  const toDate = c.req.query("toDate");
  if (!fromDate || !toDate) return c.json({ error: "fromDate and toDate required" }, 400);

  const stats = await getRegisterStats({ fromDate, toDate });
  return c.json(stats);
});

nabh.get("/registers/:id", async (c) => {
  const id = c.req.param("id");
  const result = await getRegisterById(id);
  if (!result) return c.json({ error: "Register entry not found" }, 404);
  return c.json(result);
});

// ── Committee Reports ───────────────────────────────────────────────────

const committeeSchema = z.object({
  committee: z.enum(COMMITTEE_TYPES),
  meetingDate: z.string(),
  chairperson: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  agenda: z.array(z.string()).optional(),
  minutes: z.string().optional(),
  decisions: z.array(z.object({ decision: z.string(), responsible: z.string(), deadline: z.string().optional() })).optional(),
  actionItems: z.array(z.object({ item: z.string(), assignedTo: z.string(), dueDate: z.string().optional(), status: z.string().optional() })).optional(),
  createdBy: z.string(),
});

nabh.post("/committees", zValidator("json", committeeSchema), async (c) => {
  const body = c.req.valid("json");
  const result = await createCommitteeReport(body);
  return c.json(result, 201);
});

nabh.patch("/committees/:id", zValidator("json", committeeSchema.partial()), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const result = await updateCommitteeReport(id, body);
  if (!result) return c.json({ error: "Committee report not found" }, 404);
  return c.json(result);
});

nabh.get("/committees", async (c) => {
  const committee = c.req.query("committee");
  const fromDate = c.req.query("fromDate");
  const toDate = c.req.query("toDate");
  const page = c.req.query("page") ? Number(c.req.query("page")) : 1;
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 50;

  const result = await queryCommitteeReports({ committee, fromDate, toDate, page, limit });
  return c.json(result);
});

nabh.get("/committees/types", (c) => {
  return c.json(COMMITTEE_TYPES);
});

nabh.get("/committees/stats", async (c) => {
  const fromDate = c.req.query("fromDate");
  const toDate = c.req.query("toDate");
  if (!fromDate || !toDate) return c.json({ error: "fromDate and toDate required" }, 400);

  const stats = await getCommitteeStats({ fromDate, toDate });
  return c.json(stats);
});

nabh.get("/committees/:id", async (c) => {
  const id = c.req.param("id");
  const result = await getCommitteeReportById(id);
  if (!result) return c.json({ error: "Committee report not found" }, 404);
  return c.json(result);
});

// ── Evidence Packs ──────────────────────────────────────────────────────

const evidenceSchema = z.object({
  title: z.string(),
  nabhStandard: z.string().optional(),
  periodStart: z.string(),
  periodEnd: z.string(),
  includeIndicators: z.boolean().optional(),
  includeCommittees: z.boolean().optional(),
  includeRegisters: z.boolean().optional(),
  generatedBy: z.string(),
});

nabh.post("/evidence/generate", zValidator("json", evidenceSchema), async (c) => {
  const body = c.req.valid("json");
  const result = await generateEvidencePack(body);
  return c.json(result, 201);
});

nabh.post("/evidence/:id/finalize", async (c) => {
  const id = c.req.param("id");
  const result = await finalizeEvidencePack(id);
  if (!result) return c.json({ error: "Evidence pack not found" }, 404);
  return c.json(result);
});

nabh.get("/evidence", async (c) => {
  const status = c.req.query("status");
  const nabhStandard = c.req.query("nabhStandard");
  const page = c.req.query("page") ? Number(c.req.query("page")) : 1;
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 50;

  const result = await queryEvidencePacks({ status, nabhStandard, page, limit });
  return c.json(result);
});

nabh.get("/evidence/:id", async (c) => {
  const id = c.req.param("id");
  const result = await getEvidencePackById(id);
  if (!result) return c.json({ error: "Evidence pack not found" }, 404);
  return c.json(result);
});

nabh.get("/evidence/:id/export", async (c) => {
  const id = c.req.param("id");
  const format = (c.req.query("format") as "json" | "csv") || "json";

  const result = await exportEvidencePack(id, format);
  if (!result) return c.json({ error: "Evidence pack not found" }, 404);

  if (format === "csv") {
    c.header("Content-Type", "text/csv");
    c.header("Content-Disposition", `attachment; filename="${id}.csv"`);
    return c.body(String(result));
  }

  return c.json(result);
});

export default nabh;
