import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db, schema } from "../db";
import { requirePermission } from "../middleware/rbac";

const patients = new Hono();

// List with search & pagination
patients.get("/", async (c) => {
  const query = c.req.query("q") || "";
  const limit = Math.min(Number.parseInt(c.req.query("limit") || "50"), 100);
  const offset = Number.parseInt(c.req.query("offset") || "0");

  const result = query
    ? await db.select().from(schema.patients)
        .where(sql`${schema.patients.name} ILIKE ${`%${query}%`} OR ${schema.patients.uhid} ILIKE ${`%${query}%`} OR ${schema.patients.phone} ILIKE ${`%${query}%`}`)
        .limit(limit).offset(offset)
    : await db.select().from(schema.patients).limit(limit).offset(offset);

  const total = await db.select({ count: sql<number>`count(*)` }).from(schema.patients);
  return c.json({ data: result, total: total[0].count });
});

// Get by ID
patients.get("/:id", async (c) => {
  const id = c.req.param("id");
  const result = await db.select().from(schema.patients).where(eq(schema.patients.id, id)).limit(1);
  if (!result.length) return c.json({ error: "Not found" }, 404);
  return c.json(result[0]);
});

const createPatientSchema = z.object({
  id: z.string(),
  uhid: z.string(),
  abhaId: z.string().optional(),
  name: z.string().min(1),
  age: z.number().int().positive(),
  dob: z.string(),
  sex: z.enum(["M", "F", "O"]),
  bloodGroup: z.enum(["A+","A-","B+","B-","AB+","AB-","O+","O-"]),
  phone: z.string(),
  address: z.string().optional(),
  email: z.string().email().optional(),
});

// HIPAA §164.312(a)(1): Write access requires elevated role
patients.post("/", requirePermission("patients", "write"), zValidator("json", createPatientSchema), async (c) => {
  const data = c.req.valid("json");
  await db.insert(schema.patients).values({ ...data, registeredAt: new Date() });
  return c.json({ id: data.id }, 201);
});

// HIPAA §164.312(c)(1): Validated PATCH with allowlist — prevents mass-assignment
const updatePatientSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.number().int().positive().optional(),
  phone: z.string().optional(),
  altPhone: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional(),
  occupation: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNo: z.string().optional(),
}).strict(); // .strict() rejects unknown keys

patients.patch("/:id", requirePermission("patients", "write"), zValidator("json", updatePatientSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  await db.update(schema.patients).set({ ...data, updatedAt: new Date() }).where(eq(schema.patients.id, id));
  return c.json({ success: true });
});

// Link ABHA ID — write permission required
patients.post("/:id/link-abha", requirePermission("patients", "write"), async (c) => {
  const id = c.req.param("id");
  const { abhaId } = await c.req.json() as { abhaId: string };
  if (!abhaId || typeof abhaId !== "string") {
    return c.json({ error: "Invalid abhaId" }, 400);
  }
  await db.update(schema.patients).set({ abhaId }).where(eq(schema.patients.id, id));
  return c.json({ success: true });
});

export default patients;
