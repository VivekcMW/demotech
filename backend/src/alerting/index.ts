import { db } from "../db";
import {
  labTestCatalog,
  labOrders,
  alertNotificationRules,
  alertNotifications,
  cdsAlerts,
  auditLogs,
} from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

interface CriticalThreshold {
  low?: number;
  high?: number;
  unit?: string;
}

export function isCriticalValue(
  value: number | string,
  thresholds: CriticalThreshold | null,
): { isCritical: boolean; direction?: "low" | "high" } {
  if (!thresholds) return { isCritical: false };
  const numeric = Number(value);
  if (isNaN(numeric)) return { isCritical: false };

  if (thresholds.high !== undefined && numeric >= thresholds.high) {
    return { isCritical: true, direction: "high" };
  }
  if (thresholds.low !== undefined && numeric <= thresholds.low) {
    return { isCritical: true, direction: "low" };
  }
  return { isCritical: false };
}

export async function evaluateLabResult(
  orderId: string,
  resultValue: Record<string, unknown>,
): Promise<{ isCritical: boolean; alerts: string[] }> {
  const order = await db.query.labOrders.findFirst({
    where: eq(labOrders.id, orderId),
  });
  if (!order) return { isCritical: false, alerts: [] };

  const test = await db.query.labTestCatalog.findFirst({
    where: eq(labTestCatalog.id, order.testId),
  });
  if (!test) return { isCritical: false, alerts: [] };

  const thresholds = test.criticalThresholds as Record<string, CriticalThreshold> | null;
  const alerts: string[] = [];

  for (const [param, value] of Object.entries(resultValue)) {
    const numeric = Number(value);
    if (isNaN(numeric)) continue;

    const paramThresholds = thresholds?.[param];
    const critical = isCriticalValue(numeric, paramThresholds || null);
    if (critical.isCritical) {
      const message = `Critical ${test.name} (${param}): ${value} ${paramThresholds?.unit || ""} (${critical.direction === "high" ? ">" : "<"} ${critical.direction === "high" ? paramThresholds?.high : paramThresholds?.low})`;
      alerts.push(message);

      await db.insert(cdsAlerts).values({
        id: `CRIT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        patientId: order.patientId,
        encounterId: order.encounterId || null,
        alertType: "critical_result",
        severity: "critical",
        message,
        details: { orderId, param, value, thresholds: paramThresholds } as Record<string, unknown>,
      });

      await notifyAlertRecipients("critical_result", message, { orderId, param, value });
    }
  }

  return { isCritical: alerts.length > 0, alerts };
}

export async function setCriticalThreshold(
  testId: string,
  parameter: string,
  thresholds: { low?: number; high?: number; unit?: string },
): Promise<boolean> {
  const test = await db.query.labTestCatalog.findFirst({
    where: eq(labTestCatalog.id, testId),
  });
  if (!test) return false;

  const currentThresholds = (test.criticalThresholds as Record<string, CriticalThreshold>) || {};
  currentThresholds[parameter] = thresholds;

  const [result] = await db.update(labTestCatalog)
    .set({ criticalThresholds: currentThresholds as Record<string, unknown> })
    .where(eq(labTestCatalog.id, testId))
    .returning();
  return !!result;
}

export async function getCriticalThresholds(testId: string) {
  const test = await db.query.labTestCatalog.findFirst({
    where: eq(labTestCatalog.id, testId),
  });
  return test?.criticalThresholds as Record<string, CriticalThreshold> | null;
}

// ── Notification rules ─────────────────────────────────────────────────

export async function addNotificationRule(data: {
  alertType: string;
  channel: string;
  recipient: string;
  createdBy: string;
}) {
  const id = `NR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [rule] = await db.insert(alertNotificationRules).values({
    id,
    ...data,
  }).returning();
  return rule;
}

export async function getNotificationRules(alertType?: string) {
  const conditions = [];
  if (alertType) conditions.push(eq(alertNotificationRules.alertType, alertType));
  return db.query.alertNotificationRules.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
  });
}

export async function toggleNotificationRule(ruleId: string, enabled: boolean) {
  const [rule] = await db.update(alertNotificationRules)
    .set({ enabled })
    .where(eq(alertNotificationRules.id, ruleId))
    .returning();
  return rule;
}

export async function deleteNotificationRule(ruleId: string) {
  await db.delete(alertNotificationRules).where(eq(alertNotificationRules.id, ruleId));
  return { deleted: true };
}

async function notifyAlertRecipients(
  alertType: string,
  message: string,
  details: Record<string, unknown>,
) {
  const rules = await db.query.alertNotificationRules.findMany({
    where: and(
      eq(alertNotificationRules.alertType, alertType),
      eq(alertNotificationRules.enabled, true),
    ),
  });

  for (const rule of rules) {
    const notifId = `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      let sent = false;
      if (rule.channel === "in_app") {
        sent = true;
      } else if (rule.channel === "webhook") {
        const res = await fetch(rule.recipient, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertType, message, details, timestamp: new Date().toISOString() }),
        });
        sent = res.ok;
      }

      await db.insert(alertNotifications).values({
        id: notifId,
        alertId: "",
        channel: rule.channel,
        recipient: rule.recipient,
        status: sent ? "sent" : "failed",
        error: sent ? null : "Delivery failed",
      });
    } catch {
      await db.insert(alertNotifications).values({
        id: notifId,
        alertId: "",
        channel: rule.channel,
        recipient: rule.recipient,
        status: "failed",
        error: "Exception during delivery",
      });
    }
  }
}

export async function getAlertNotifications(limit = 50) {
  return db.query.alertNotifications.findMany({
    orderBy: (n, { desc }) => [desc(n.sentAt)],
    limit,
  });
}
