import { Hono } from "hono";
import { eq, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db, schema } from "../db";

const appointments = new Hono();

appointments.get("/", async (c) => {
  const date = c.req.query("date");
  const status = c.req.query("status");
  const patientId = c.req.query("patient_id");
  const doctorId = c.req.query("doctor_id");
  const limit = parseInt(c.req.query("limit") || "50");

  let query = db.select().from(schema.appointments);
  const conditions = [];
  if (date) conditions.push(sql`date(${schema.appointments.datetime}) = ${date}`);
  if (status) conditions.push(eq(schema.appointments.status, status));
  if (patientId) conditions.push(eq(schema.appointments.patientId, patientId));
  if (doctorId) conditions.push(eq(schema.appointments.doctorId, doctorId));
  if (conditions.length) query = query.where(sql.join(conditions, sql` AND `));
  query = query.orderBy(desc(schema.appointments.datetime)).limit(limit);

  const result = await query;
  return c.json({ data: result });
});

appointments.get("/:id", async (c) => {
  const result = await db.select().from(schema.appointments).where(eq(schema.appointments.id, c.req.param("id"))).limit(1);
  return result.length ? c.json(result[0]) : c.json({ error: "Not found" }, 404);
});

const createSchema = z.object({
  patientId: z.string(),
  doctorId: z.string().optional(),
  department: z.string(),
  datetime: z.string(),
  duration: z.number().default(15),
  reason: z.string().optional(),
});

appointments.post("/", zValidator("json", createSchema), async (c) => {
  const data = c.req.valid("json");
  const id = `APPT-${Date.now().toString(36).toUpperCase()}`;
  await db.insert(schema.appointments).values({ id, ...data, datetime: new Date(data.datetime) });
  return c.json({ id }, 201);
});

appointments.patch("/:id/status", async (c) => {
  const { status } = await c.req.json();
  await db.update(schema.appointments).set({ status }).where(eq(schema.appointments.id, c.req.param("id")));
  return c.json({ success: true });
});

appointments.delete("/:id", async (c) => {
  await db.delete(schema.appointments).where(eq(schema.appointments.id, c.req.param("id")));
  return c.json({ success: true });
});

export default appointments;
