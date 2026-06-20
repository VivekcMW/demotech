import { Hono } from "hono";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db, schema } from "../db";
import { requirePermission } from "../middleware/rbac";

const encounters = new Hono();

encounters.get("/", async (c) => {
  const patientId = c.req.query("patient_id");
  const limit = Number.parseInt(c.req.query("limit") || "20");

  let query = db.select().from(schema.encounters).orderBy(desc(schema.encounters.datetime));
  if (patientId) query = query.where(eq(schema.encounters.patientId, patientId));
  query = query.limit(limit);

  return c.json({ data: await query });
});

encounters.get("/:id", async (c) => {
  const result = await db.select().from(schema.encounters).where(eq(schema.encounters.id, c.req.param("id"))).limit(1);
  return result.length ? c.json(result[0]) : c.json({ error: "Not found" }, 404);
});

const createSchema = z.object({
  patientId: z.string(),
  doctorId: z.string().optional(),
  department: z.string(),
  type: z.enum(["OPD", "IPD", "Emergency", "Telemedicine"]).default("OPD"),
  chiefComplaint: z.string().optional(),
});

encounters.post("/", requirePermission("encounters", "write"), zValidator("json", createSchema), async (c) => {
  const data = c.req.valid("json");
  const id = `ENC-${Date.now().toString(36).toUpperCase()}`;
  await db.insert(schema.encounters).values({ id, ...data });
  return c.json({ id }, 201);
});

// HIPAA §164.312(c)(1): Validated PATCH with allowlist — prevents mass-assignment
const updateEncounterSchema = z.object({
  chiefComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  type: z.enum(["OPD", "IPD", "Emergency", "Telemedicine"]).optional(),
}).strict();

encounters.patch("/:id", requirePermission("encounters", "write"), zValidator("json", updateEncounterSchema), async (c) => {
  const data = c.req.valid("json");
  await db.update(schema.encounters).set(data).where(eq(schema.encounters.id, c.req.param("id")));
  return c.json({ success: true });
});

// Get vitals for encounter
encounters.get("/:id/vitals", async (c) => {
  const result = await db.select().from(schema.vitals).where(eq(schema.vitals.encounterId, c.req.param("id"))).limit(1);
  return c.json(result[0] || null);
});

// Get diagnoses for encounter
encounters.get("/:id/diagnoses", async (c) => {
  const result = await db.select().from(schema.diagnoses).where(eq(schema.diagnoses.encounterId, c.req.param("id")));
  return c.json({ data: result });
});

export default encounters;
