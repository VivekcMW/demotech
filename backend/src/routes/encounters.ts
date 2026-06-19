import { Hono } from "hono";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db, schema } from "../db";

const encounters = new Hono();

encounters.get("/", async (c) => {
  const patientId = c.req.query("patient_id");
  const limit = parseInt(c.req.query("limit") || "20");

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

encounters.post("/", zValidator("json", createSchema), async (c) => {
  const data = c.req.valid("json");
  const id = `ENC-${Date.now().toString(36).toUpperCase()}`;
  await db.insert(schema.encounters).values({ id, ...data });
  return c.json({ id }, 201);
});

encounters.patch("/:id", async (c) => {
  const body = await c.req.json();
  await db.update(schema.encounters).set(body).where(eq(schema.encounters.id, c.req.param("id")));
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
