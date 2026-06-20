import { Hono } from "hono";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db, schema } from "../db";
import { parseHL7Message, messageType, toJSON } from "../hl7";
import {
  generateAdmitMessage,
  generateDischargeMessage,
  generateRegisterMessage,
  generateUpdateMessage,
  generateOrderMessage,
  generateResultMessage,
} from "../hl7";

const integration = new Hono();

// ── Integration Endpoints CRUD ──────────────────────────────────────────────

integration.get("/endpoints", async (c) => {
  const type = c.req.query("type");
  let query = db.select().from(schema.fhirEndpoints).orderBy(desc(schema.fhirEndpoints.createdAt));
  if (type) query = query.where(eq(schema.fhirEndpoints.type, type));
  return c.json({ data: await query });
});

const endpointSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["lis", "ris", "pacs", "hie", "abdm", "fhir", "hl7"]),
  protocol: z.enum(["mllp", "dicomweb", "fhir_rest", "hl7_mllp"]),
  host: z.string().min(1),
  port: z.number().int().optional(),
  path: z.string().optional(),
  username: z.string().optional(),
  encryptedPassword: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

const endpointUpdateSchema = endpointSchema.partial();

integration.post("/endpoints", zValidator("json", endpointSchema), async (c) => {
  const data = c.req.valid("json");
  const id = `EP-${Date.now().toString(36).toUpperCase()}`;
  await db.insert(schema.fhirEndpoints).values({ id, ...data });
  const [created] = await db.select().from(schema.fhirEndpoints).where(eq(schema.fhirEndpoints.id, id)).limit(1);
  return c.json(created, 201);
});

integration.patch("/endpoints/:id", zValidator("json", endpointUpdateSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  await db.update(schema.fhirEndpoints).set(data).where(eq(schema.fhirEndpoints.id, id));
  const [updated] = await db.select().from(schema.fhirEndpoints).where(eq(schema.fhirEndpoints.id, id)).limit(1);
  return updated ? c.json(updated) : c.json({ error: "Not found" }, 404);
});

integration.delete("/endpoints/:id", async (c) => {
  const id = c.req.param("id");
  const [existing] = await db.select().from(schema.fhirEndpoints).where(eq(schema.fhirEndpoints.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  await db.delete(schema.fhirEndpoints).where(eq(schema.fhirEndpoints.id, id));
  return c.json({ success: true });
});

integration.post("/endpoints/:id/test", async (c) => {
  const id = c.req.param("id");
  const [ep] = await db.select().from(schema.fhirEndpoints).where(eq(schema.fhirEndpoints.id, id)).limit(1);
  if (!ep) return c.json({ error: "Not found" }, 404);

  const start = Date.now();
  let success = false;
  let errorMessage: string | undefined;

  try {
    const socket = new (await import("net")).Socket();
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error("Connection timeout"));
      }, 5000);

      socket.connect(ep.port || 2575, ep.host, () => {
        clearTimeout(timeout);
        success = true;
        socket.destroy();
        resolve();
      });

      socket.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  } catch (err) {
    errorMessage = String(err);
  }

  const durationMs = Date.now() - start;

  await db.update(schema.fhirEndpoints).set({
    status: success ? "active" : "error",
    lastTestedAt: new Date(),
    errorCount: success ? 0 : (ep.errorCount || 0) + 1,
  }).where(eq(schema.fhirEndpoints.id, id));

  await db.insert(schema.fhirIntegrationLog).values({
    id: `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: "hl7",
    direction: "outbound",
    messageType: "CONNECTION_TEST",
    resourceType: "Endpoint",
    resourceId: id,
    status: success ? "success" : "error",
    errorMessage,
    durationMs,
    createdAt: new Date(),
  });

  return c.json({ success, durationMs, error: errorMessage });
});

// ── Integration Logs ────────────────────────────────────────────────────────

integration.get("/logs", async (c) => {
  const source = c.req.query("source");
  const status = c.req.query("status");
  const limit = Math.min(Number.parseInt(c.req.query("limit") || "50"), 200);
  const offset = Number.parseInt(c.req.query("offset") || "0");

  let query = db.select().from(schema.fhirIntegrationLog).orderBy(desc(schema.fhirIntegrationLog.createdAt));
  if (source) query = query.where(eq(schema.fhirIntegrationLog.source, source));
  if (status) query = query.where(eq(schema.fhirIntegrationLog.status, status));
  query = query.limit(limit).offset(offset);

  const [results, countResult] = await Promise.all([
    query,
    db.select({ count: sql<number>`count(*)::int` }).from(schema.fhirIntegrationLog),
  ]);

  return c.json({ data: results, total: countResult[0].count, limit, offset });
});

integration.get("/logs/:id", async (c) => {
  const id = c.req.param("id");
  const [entry] = await db.select().from(schema.fhirIntegrationLog).where(eq(schema.fhirIntegrationLog.id, id)).limit(1);
  return entry ? c.json(entry) : c.json({ error: "Not found" }, 404);
});

// ── HL7 Testing Utilities ───────────────────────────────────────────────────

const parseSchema = z.object({
  message: z.string().min(10),
});

integration.post("/hl7/parse", zValidator("json", parseSchema), async (c) => {
  const { message } = c.req.valid("json");
  try {
    const parsed = parseHL7Message(message);
    return c.json({
      messageType: messageType(parsed),
      msh: parsed.msh,
      segmentCount: parsed.segments.length,
      segments: parsed.segments.map((s) => ({
        type: s.type,
        fieldCount: s.fields.length,
        raw: s.raw,
      })),
      json: toJSON(parsed),
    });
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

const generateSchema = z.object({
  messageType: z.enum(["ADT^A01", "ADT^A03", "ADT^A04", "ADT^A08", "ORM^O01", "ORU^R01"]),
  patient: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    phone: z.string().optional(),
  }).optional().default({}),
  encounter: z.object({
    id: z.string().optional(),
    class: z.string().optional(),
  }).optional().default({}),
  order: z.object({
    id: z.string().optional(),
    testCode: z.string().optional(),
    testName: z.string().optional(),
  }).optional().default({}),
  observation: z.object({
    code: z.string().optional(),
    name: z.string().optional(),
    value: z.string().optional(),
    unit: z.string().optional(),
  }).optional().default({}),
});

integration.post("/hl7/generate", zValidator("json", generateSchema), async (c) => {
  const data = c.req.valid("json");
  let message: string;

  switch (data.messageType) {
    case "ADT^A01":
      message = generateAdmitMessage(data.patient, data.encounter);
      break;
    case "ADT^A03":
      message = generateDischargeMessage(data.patient, data.encounter);
      break;
    case "ADT^A04":
      message = generateRegisterMessage(data.patient);
      break;
    case "ADT^A08":
      message = generateUpdateMessage(data.patient);
      break;
    case "ORM^O01":
      message = generateOrderMessage(data.order, data.patient);
      break;
    case "ORU^R01":
      message = generateResultMessage(data.observation, data.patient);
      break;
    default:
      return c.json({ error: "Unsupported message type" }, 400);
  }

  return c.json({ message, parsed: parseHL7Message(message) });
});

export default integration;
