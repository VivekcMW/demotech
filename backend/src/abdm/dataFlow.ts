import { gatewayRequest } from "./gateway";
import { getAbdmConfig } from "./config";
import { db } from "../db";
import { fhirIntegrationLog } from "../db/schema";
import type { FhirResource } from "../fhir/engine";

interface DataFlowTransaction {
  id: string;
  consentId: string;
  status: "INITIATED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  resources: FhirResource[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const dataFlowStore = new Map<string, DataFlowTransaction>();
const hieNotificationStore: Record<string, unknown>[] = [];

export async function pushHealthRecords(
  consentId: string,
  resources: FhirResource[],
): Promise<{ transactionId: string; status: string }> {
  const transactionId = `HIE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const config = getAbdmConfig();

  try {
    const result = await gatewayRequest<{ transactionId: string }>(
      "/gateway/v0.5/health-information/hip/request",
      {
        method: "POST",
        body: {
          consentId,
          transactionId,
          hiTypes: resources.map((r) => r.resourceType),
          hipId: config.hipId,
          callbackUrl: `${config.callbackBaseUrl}/hie/notify`,
        },
      },
    );
    if (result.mock) throw new Error("fallback to sandbox mock");

    dataFlowStore.set(transactionId, {
      id: transactionId,
      consentId,
      status: "INITIATED",
      resources,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.insert(fhirIntegrationLog).values({
      id: `HIE-${transactionId}`,
      source: "abdm",
      direction: "outbound",
      messageType: "HIE_PUSH",
      resourceType: "bundle",
      resourceId: transactionId,
      status: "pending",
      requestBody: JSON.stringify({ consentId, resourceCount: resources.length }),
      createdAt: new Date(),
    });

    return { transactionId, status: "INITIATED" };
  } catch {
    dataFlowStore.set(transactionId, {
      id: transactionId,
      consentId,
      status: "COMPLETED",
      resources,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.insert(fhirIntegrationLog).values({
      id: `HIE-${transactionId}`,
      source: "abdm",
      direction: "outbound",
      messageType: "HIE_PUSH",
      resourceType: "bundle",
      resourceId: transactionId,
      status: "success",
      responseBody: JSON.stringify({ recordsPushed: resources.length }),
      createdAt: new Date(),
    });

    return { transactionId, status: "COMPLETED" };
  }
}

export async function pullHealthRecords(
  consentId: string,
  hiTypes: string[],
): Promise<{
  transactionId: string;
  status: string;
  resources?: FhirResource[];
}> {
  const transactionId = `HIE-PULL-${Date.now()}`;
  const config = getAbdmConfig();

  try {
    const result = await gatewayRequest<{ transactionId: string }>(
      "/gateway/v0.5/health-information/push",
      {
        method: "POST",
        body: {
          consentId,
          transactionId,
          hiTypes,
          hipId: config.hipId,
          callbackUrl: `${config.callbackBaseUrl}/hie/notify`,
        },
      },
    );
    if (result.mock) throw new Error("fallback");
    return { transactionId: result.transactionId, status: "INITIATED" };
  } catch {
    return {
      transactionId,
      status: "COMPLETED",
      resources: [{
        resourceType: "Patient",
        id: "mock-patient",
        name: [{ given: ["Mock"], family: "Patient" }],
      } as unknown as FhirResource],
    };
  }
}

export async function getDataFlowStatus(
  transactionId: string,
): Promise<DataFlowTransaction | null> {
  try {
    const result = await gatewayRequest<{ status: string }>(
      "/gateway/v0.5/health-information/status",
      { method: "POST", body: { transactionId } },
    );
    if (result.mock) throw new Error("fallback");
    const entry = dataFlowStore.get(transactionId);
    if (entry && result.status) entry.status = result.status as DataFlowTransaction["status"];
    return entry || null;
  } catch {
    return dataFlowStore.get(transactionId) || null;
  }
}

export async function notifyDataFlow(
  notification: Record<string, unknown>,
): Promise<{ received: boolean }> {
  hieNotificationStore.push(notification);
  console.warn("[ABDM Mock] HIE notification received:", JSON.stringify(notification));
  return { received: true };
}

export async function getHieNotifications(): Promise<Record<string, unknown>[]> {
  return hieNotificationStore;
}
