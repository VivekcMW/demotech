import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { labTestCatalog } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  setCriticalThreshold,
  getCriticalThresholds,
  evaluateLabResult,
  addNotificationRule,
  getNotificationRules,
  toggleNotificationRule,
  deleteNotificationRule,
  getAlertNotifications,
} from "../alerting";

const alerting = new Hono();

// ── Critical Thresholds ─────────────────────────────────────────────────

const thresholdSchema = z.object({
  testId: z.string(),
  parameter: z.string(),
  low: z.number().optional(),
  high: z.number().optional(),
  unit: z.string().optional(),
});

alerting.post("/thresholds", zValidator("json", thresholdSchema), async (c) => {
  const { testId, parameter, low, high, unit } = c.req.valid("json");
  const success = await setCriticalThreshold(testId, parameter, { low, high, unit });
  if (!success) return c.json({ error: "Test not found" }, 404);
  return c.json({ success: true });
});

alerting.get("/thresholds/:testId", async (c) => {
  const testId = c.req.param("testId");
  const thresholds = await getCriticalThresholds(testId);
  return c.json(thresholds || {});
});

alerting.get("/thresholds", async (c) => {
  const testsWithThresholds = await db.query.labTestCatalog.findMany({
    where: (t, { sql }) => sql`${t.criticalThresholds} != '{}'::jsonb`,
  });
  return c.json({
    data: testsWithThresholds.map((t) => ({
      id: t.id,
      name: t.name,
      thresholds: t.criticalThresholds,
    })),
  });
});

// ── Result Evaluation ───────────────────────────────────────────────────

const evaluateSchema = z.object({
  orderId: z.string(),
  result: z.record(z.unknown()),
});

alerting.post("/evaluate", zValidator("json", evaluateSchema), async (c) => {
  const { orderId, result } = c.req.valid("json");
  const evaluation = await evaluateLabResult(orderId, result);
  return c.json(evaluation);
});

// ── Notification Rules ──────────────────────────────────────────────────

const ruleSchema = z.object({
  alertType: z.string(),
  channel: z.enum(["sms", "email", "in_app", "webhook"]),
  recipient: z.string(),
  createdBy: z.string(),
});

alerting.post("/rules", zValidator("json", ruleSchema), async (c) => {
  const rule = await addNotificationRule(c.req.valid("json"));
  return c.json(rule, 201);
});

alerting.get("/rules", async (c) => {
  const alertType = c.req.query("alertType");
  const rules = await getNotificationRules(alertType);
  return c.json({ data: rules });
});

alerting.patch("/rules/:id/toggle", async (c) => {
  const id = c.req.param("id");
  const { enabled } = await c.req.json();
  const rule = await toggleNotificationRule(id, enabled);
  if (!rule) return c.json({ error: "Rule not found" }, 404);
  return c.json(rule);
});

alerting.delete("/rules/:id", async (c) => {
  const id = c.req.param("id");
  await deleteNotificationRule(id);
  return c.json({ success: true });
});

// ── Notification Log ────────────────────────────────────────────────────

alerting.get("/notifications", async (c) => {
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 50;
  const notifications = await getAlertNotifications(limit);
  return c.json({ data: notifications });
});

export default alerting;
