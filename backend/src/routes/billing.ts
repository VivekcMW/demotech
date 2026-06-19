import { Hono } from "hono";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db, schema } from "../db";

const billing = new Hono();

billing.get("/", async (c) => {
  const patientId = c.req.query("patient_id");
  const status = c.req.query("status");
  const limit = parseInt(c.req.query("limit") || "50");

  let query = db.select().from(schema.billing).orderBy(desc(schema.billing.createdAt));
  if (patientId) query = query.where(eq(schema.billing.patientId, patientId));
  if (status) query = query.where(eq(schema.billing.status, status));
  query = query.limit(limit);
  return c.json({ data: await query });
});

billing.get("/:id", async (c) => {
  const result = await db.select().from(schema.billing).where(eq(schema.billing.id, c.req.param("id"))).limit(1);
  if (!result.length) return c.json({ error: "Not found" }, 404);
  const claimsData = await db.select().from(schema.claims).where(eq(schema.claims.billId, result[0].id));
  return c.json({ ...result[0], claims: claimsData });
});

const createBillSchema = z.object({
  patientId: z.string(),
  encounterId: z.string().optional(),
  total: z.number().positive(),
  discount: z.number().default(0),
  netAmount: z.number().positive(),
  paid: z.number().default(0),
  items: z.array(z.any()),
  paymentMode: z.string().optional(),
});

billing.post("/", zValidator("json", createBillSchema), async (c) => {
  const data = c.req.valid("json");
  const id = `BILL-${Date.now().toString(36).toUpperCase()}`;
  const balance = data.netAmount - data.paid;
  const status = balance <= 0 ? "Paid" : data.paid > 0 ? "Partial" : "Pending";
  await db.insert(schema.billing).values({ id, ...data, balance: Math.max(0, balance), status });
  return c.json({ id }, 201);
});

billing.post("/:id/payment", async (c) => {
  const { amount, mode } = await c.req.json();
  const bill = await db.select().from(schema.billing).where(eq(schema.billing.id, c.req.param("id"))).limit(1);
  if (!bill.length) return c.json({ error: "Not found" }, 404);

  const newPaid = parseFloat(bill[0].paid.toString()) + amount;
  const newBalance = parseFloat(bill[0].netAmount.toString()) - newPaid;
  const newStatus = newBalance <= 0 ? "Paid" : "Partial";

  await db.update(schema.billing).set({
    paid: newPaid.toString(),
    balance: Math.max(0, newBalance).toString(),
    status: newStatus,
    paymentMode: mode,
  }).where(eq(schema.billing.id, c.req.param("id")));

  return c.json({ success: true });
});

// Claims
billing.get("/:id/claims", async (c) => {
  const result = await db.select().from(schema.claims).where(eq(schema.claims.billId, c.req.param("id")));
  return c.json({ data: result });
});

billing.post("/:id/claims", async (c) => {
  const body = await c.req.json();
  const id = `CLM-${Date.now().toString(36).toUpperCase()}`;
  await db.insert(schema.claims).values({ id, billId: c.req.param("id"), ...body, submittedAt: new Date() });
  return c.json({ id }, 201);
});

export default billing;
