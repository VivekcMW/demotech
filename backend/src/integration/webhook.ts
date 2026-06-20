import { db, schema } from "../db";
import { eq, and } from "drizzle-orm";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function dispatchWebhook(subscription: Record<string, any>, resource: Record<string, any>): Promise<boolean> {
  const logId = `WH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const start = Date.now();
  let lastError: string | undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-ID": logId,
        "X-Event-Type": subscription.resourceType || "unknown",
        ...(subscription.channelHeaders || {}),
      };

      const body = JSON.stringify(resource);
      const response = await fetch(subscription.channelEndpoint, {
        method: "POST",
        headers,
        body,
      });

      const durationMs = Date.now() - start;

      if (response.ok) {
        await db.insert(schema.fhirIntegrationLog).values({
          id: logId,
          source: "webhook",
          direction: "outbound",
          messageType: subscription.resourceType,
          resourceType: subscription.resourceType,
          resourceId: resource.id,
          status: "success",
          requestBody: body.substring(0, 2000),
          responseBody: `HTTP ${response.status}`,
          durationMs,
          createdAt: new Date(),
        });

        return true;
      }

      lastError = `HTTP ${response.status}`;
    } catch (err) {
      lastError = String(err);
    }

    if (attempt < 2) {
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000);
      await sleep(delay);
    }
  }

  const durationMs = Date.now() - start;
  await db.insert(schema.fhirIntegrationLog).values({
    id: logId,
    source: "webhook",
    direction: "outbound",
    messageType: subscription.resourceType,
    resourceType: subscription.resourceType,
    resourceId: resource.id,
    status: "error",
    errorMessage: lastError,
    durationMs,
    createdAt: new Date(),
  });

  return false;
}

export async function dispatchAllSubscriptions(eventType: string, resourceType: string, resource: Record<string, any>): Promise<void> {
  const subscriptions = await db
    .select()
    .from(schema.fhirSubscriptions)
    .where(
      and(
        eq(schema.fhirSubscriptions.status, "active"),
        eq(schema.fhirSubscriptions.resourceType, resourceType),
      ),
    );

  const results = await Promise.allSettled(
    subscriptions.map((sub) => dispatchWebhook(sub, resource)),
  );

  const failures = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value));
  if (failures.length > 0) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      source: "webhook",
      message: `${failures.length}/${subscriptions.length} webhook dispatches failed`,
    }));
  }
}
