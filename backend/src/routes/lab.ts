import { Hono } from "hono";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db, schema } from "../db";

const lab = new Hono();

// Test catalog
lab.get("/catalog", async (c) => {
  const cat = c.req.query("category");
  let query = db.select().from(schema.labTestCatalog);
  if (cat) query = query.where(eq(schema.labTestCatalog.category, cat));
  return c.json({ data: await query });
});

// Orders
lab.get("/orders", async (c) => {
  const patientId = c.req.query("patient_id");
  const status = c.req.query("status");
  const limit = parseInt(c.req.query("limit") || "50");

  let query = db.select().from(schema.labOrders).orderBy(desc(schema.labOrders.createdAt));
  if (patientId) query = query.where(eq(schema.labOrders.patientId, patientId));
  if (status) query = query.where(eq(schema.labOrders.status, status));
  query = query.limit(limit);

  return c.json({ data: await query });
});

lab.get("/orders/:id", async (c) => {
  const result = await db.select().from(schema.labOrders).where(eq(schema.labOrders.id, c.req.param("id"))).limit(1);
  return result.length ? c.json(result[0]) : c.json({ error: "Not found" }, 404);
});

const orderSchema = z.object({
  patientId: z.string(),
  doctorId: z.string().optional(),
  encounterId: z.string().optional(),
  testId: z.string(),
  priority: z.enum(["Routine", "Urgent", "STAT"]).default("Routine"),
  notes: z.string().optional(),
});

lab.post("/orders", zValidator("json", orderSchema), async (c) => {
  const data = c.req.valid("json");
  const id = `LAB-${Date.now().toString(36).toUpperCase()}`;
  await db.insert(schema.labOrders).values({ id, ...data });
  return c.json({ id }, 201);
});

lab.patch("/orders/:id/status", async (c) => {
  const { status, ...rest } = await c.req.json();
  const update: Record<string, unknown> = { status };
  if (status === "Collected") update.collectedAt = new Date();
  if (status === "Completed" || status === "Verified") { update.resultedAt = new Date(); }
  Object.assign(update, rest);
  await db.update(schema.labOrders).set(update).where(eq(schema.labOrders.id, c.req.param("id")));
  return c.json({ success: true });
});

lab.post("/orders/:id/results", async (c) => {
  const body = await c.req.json();
  await db.update(schema.labOrders).set({
    result: body.result,
    status: "Completed",
    resultedAt: new Date(),
  }).where(eq(schema.labOrders.id, c.req.param("id")));
  return c.json({ success: true });
});

// Worklist
lab.get("/worklist", async (c) => {
  const status = c.req.query("status") || "Ordered";
  const result = await db.select().from(schema.labOrders).where(eq(schema.labOrders.status, status));
  return c.json({ data: result });
});

export default lab;
