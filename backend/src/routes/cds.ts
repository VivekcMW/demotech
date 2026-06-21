import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { drugInteractions, cdsAlerts, rxItems } from "../db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  checkPrescriptionInteractions,
  checkDuplicateTherapy,
  createCdsAlert,
  acknowledgeAlert,
  getPatientAlerts,
} from "../cds";

const cds = new Hono();

// ── Drug Interaction Checking ───────────────────────────────────────────

const interactionCheckSchema = z.object({
  items: z.array(z.object({ drugCode: z.string(), drugName: z.string() })),
});

cds.post("/interactions/check", zValidator("json", interactionCheckSchema), async (c) => {
  const { items } = c.req.valid("json");
  const interactions = await checkPrescriptionInteractions(items);
  return c.json({ interactions, count: interactions.length });
});

cds.get("/interactions/cached", async (c) => {
  const drugCode = c.req.query("drugCode");
  const query = db.query.drugInteractions.findMany({
    orderBy: [desc(drugInteractions.lastVerified)],
    limit: 100,
  });
  // if drugCode provided, search by either drugCode1 or drugCode2
  if (drugCode) {
    const filtered = await db.query.drugInteractions.findMany({
      where: sql`${drugInteractions.drugCode1} = ${drugCode} OR ${drugInteractions.drugCode2} = ${drugCode}`,
      orderBy: [desc(drugInteractions.lastVerified)],
      limit: 100,
    });
    return c.json({ data: filtered, count: filtered.length });
  }
  return c.json({ data: await query, count: 0 });
});

// ── Duplicate Therapy ───────────────────────────────────────────────────

cds.post("/duplicate-therapy/check", async (c) => {
  const { patientId, drugCode } = await c.req.json();
  if (!patientId || !drugCode) return c.json({ error: "patientId and drugCode required" }, 400);

  const duplicate = await checkDuplicateTherapy(patientId, drugCode);
  return c.json({ duplicate, severity: duplicate ? "warning" : "none" });
});

// ── CDS Alerts ──────────────────────────────────────────────────────────

cds.get("/alerts", async (c) => {
  const patientId = c.req.query("patientId");
  const alertType = c.req.query("alertType");
  const unacknowledgedOnly = c.req.query("unacknowledged") === "true";

  if (patientId) {
    const alerts = await getPatientAlerts(patientId, unacknowledgedOnly);
    return c.json({ data: alerts, count: alerts.length });
  }

  const conditions = [];
  if (alertType) conditions.push(eq(cdsAlerts.alertType, alertType));
  if (unacknowledgedOnly) conditions.push(sql`${cdsAlerts.acknowledgedAt} IS NULL`);

  const alerts = await db.query.cdsAlerts.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(cdsAlerts.createdAt)],
    limit: 100,
  });
  return c.json({ data: alerts, count: alerts.length });
});

cds.post("/alerts/:id/acknowledge", async (c) => {
  const id = c.req.param("id");
  const { userId } = await c.req.json();
  const success = await acknowledgeAlert(id, userId);
  if (!success) return c.json({ error: "Alert not found" }, 404);
  return c.json({ success: true });
});

cds.get("/alerts/stats", async (c) => {
  const stats = await db.select({
    alertType: cdsAlerts.alertType,
    severity: cdsAlerts.severity,
    count: sql<number>`count(*)::int`,
    unacknowledged: sql<number>`count(*) FILTER (WHERE acknowledged_at IS NULL)::int`,
  })
    .from(cdsAlerts)
    .groupBy(cdsAlerts.alertType, cdsAlerts.severity)
    .orderBy(desc(sql`count(*)`));

  return c.json({ data: stats });
});

export default cds;
