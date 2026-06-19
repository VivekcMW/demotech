import { Hono } from "hono";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db, schema } from "../db";

const orders = new Hono();

orders.get("/", async (c) => {
  const patientId = c.req.query("patient_id");
  const status = c.req.query("status");
  const limit = parseInt(c.req.query("limit") || "50");

  let query = db.select().from(schema.prescriptions).orderBy(desc(schema.prescriptions.createdAt));
  if (patientId) query = query.where(eq(schema.prescriptions.patientId, patientId));
  if (status) query = query.where(eq(schema.prescriptions.status, status));
  query = query.limit(limit);

  const prescriptions = await query;

  // Fetch items for each prescription
  const result = await Promise.all(prescriptions.map(async (rx) => ({
    ...rx,
    items: await db.select().from(schema.rxItems).where(eq(schema.rxItems.prescriptionId, rx.id)),
  })));

  return c.json({ data: result });
});

orders.get("/:id", async (c) => {
  const rx = await db.select().from(schema.prescriptions).where(eq(schema.prescriptions.id, c.req.param("id"))).limit(1);
  if (!rx.length) return c.json({ error: "Not found" }, 404);
  const items = await db.select().from(schema.rxItems).where(eq(schema.rxItems.prescriptionId, rx[0].id));
  return c.json({ ...rx[0], items });
});

const createRxSchema = z.object({
  patientId: z.string(),
  doctorId: z.string().optional(),
  encounterId: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    drugCode: z.string(),
    drugName: z.string(),
    dosage: z.string(),
    route: z.string().optional(),
    frequency: z.string(),
    duration: z.string().optional(),
    quantity: z.number().optional(),
    instructions: z.string().optional(),
  })),
});

orders.post("/", zValidator("json", createRxSchema), async (c) => {
  const data = c.req.valid("json");
  const id = `RX-${Date.now().toString(36).toUpperCase()}`;
  const { items, ...rxData } = data;

  await db.insert(schema.prescriptions).values({ id, ...rxData });

  for (const item of items) {
    await db.insert(schema.rxItems).values({
      id: `RXI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6)}`,
      prescriptionId: id,
      ...item,
    });
  }

  return c.json({ id }, 201);
});

orders.patch("/:id/status", async (c) => {
  const { status, receivedAt } = await c.req.json();
  const update: Record<string, unknown> = { status };
  if (receivedAt) update.receivedAt = new Date(receivedAt);
  await db.update(schema.prescriptions).set(update).where(eq(schema.prescriptions.id, c.req.param("id")));
  return c.json({ success: true });
});

export default orders;
