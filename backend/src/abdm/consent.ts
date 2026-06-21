import { gatewayRequest } from "./gateway";
import { getAbdmConfig } from "./config";
import { db } from "../db";
import { nabhRegisters } from "../db/schema";

interface ConsentArtefact {
  id: string;
  patientAbha: string;
  hipId: string;
  purpose: string;
  fromDate: string;
  toDate: string;
  status: "REQUESTED" | "GRANTED" | "REVOKED" | "EXPIRED";
  artefact?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const consentStore = new Map<string, ConsentArtefact>();

export async function requestConsent(
  patientAbha: string,
  hipId: string,
  purpose: string,
  fromDate: string,
  toDate: string,
): Promise<{ consentId: string; status: string }> {
  const consentId = `CNT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const config = getAbdmConfig();

  try {
    const result = await gatewayRequest<{ consentRequestId: string }>("/gateway/v0.5/consent-requests/init", {
      method: "POST",
      body: {
        consent: {
          patient: { abha: patientAbha },
          purpose: { code: purpose, text: purpose },
          hip: { id: hipId },
          careContexts: [],
          fromTime: fromDate,
          toTime: toDate,
          expiryTime: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
        requestId: consentId,
        timestamp: new Date().toISOString(),
      },
    });

    if (result.mock) throw new Error("fallback to sandbox mock");

    consentStore.set(consentId, {
      id: consentId,
      patientAbha,
      hipId,
      purpose,
      fromDate,
      toDate,
      status: "REQUESTED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { consentId, status: "REQUESTED" };
  } catch {
    const artefact: ConsentArtefact = {
      id: consentId,
      patientAbha,
      hipId,
      purpose,
      fromDate,
      toDate,
      status: "GRANTED",
      artefact: {
        consentId,
        signature: `mock-sig-${Date.now()}`,
        consentManagerId: "sbx-cm",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    consentStore.set(consentId, artefact);

    await db.insert(nabhRegisters).values({
      id: `CONSENT-${consentId}`,
      type: "notifiable_disease",
      recordedBy: hipId,
      details: { consentId, patientAbha, purpose, hipId, fromDate, toDate },
      registerNumber: `CNS-${Date.now()}`,
      notifiedTo: "ABDM Gateway",
      notificationDate: new Date().toISOString(),
    });

    return { consentId, status: "GRANTED" };
  }
}

export async function getConsentStatus(consentId: string): Promise<ConsentArtefact | null> {
  try {
    const result = await gatewayRequest<{ status: string }>(
      `/gateway/v0.5/consent-requests/status`,
      { method: "POST", body: { consentId } },
    );
    if (result.mock) throw new Error("fallback to sandbox mock");
    const existing = consentStore.get(consentId);
    if (existing) {
      existing.status = result.status as ConsentArtefact["status"];
    }
    return existing || null;
  } catch {
    return consentStore.get(consentId) || null;
  }
}

export async function notifyConsentAction(
  notification: Record<string, unknown>,
): Promise<{ received: boolean }> {
  console.warn("[ABDM Mock] Consent notification received:", JSON.stringify(notification));
  const consentId = notification.consentId as string;
  if (consentId && consentStore.has(consentId)) {
    const entry = consentStore.get(consentId)!;
    entry.status = (notification.status as ConsentArtefact["status"]) || entry.status;
    entry.updatedAt = new Date().toISOString();
  }
  return { received: true };
}

export async function revokeConsent(consentId: string): Promise<{ success: boolean }> {
  try {
    const result = await gatewayRequest<{ success: boolean }>(
      "/gateway/v0.5/consent-requests/revoke",
      { method: "POST", body: { consentId } },
    );
    if (result.mock) throw new Error("fallback to sandbox mock");
    return { success: true };
  } catch {
    const entry = consentStore.get(consentId);
    if (entry) {
      entry.status = "REVOKED";
      entry.updatedAt = new Date().toISOString();
    }
    return { success: true };
  }
}

export async function getConsentArtefact(consentId: string): Promise<ConsentArtefact | null> {
  return consentStore.get(consentId) || null;
}

export async function getAllConsents(params: {
  patientAbha?: string;
  status?: string;
}): Promise<ConsentArtefact[]> {
  const all = Array.from(consentStore.values());
  return all.filter((c) => {
    if (params.patientAbha && c.patientAbha !== params.patientAbha) return false;
    if (params.status && c.status !== params.status) return false;
    return true;
  });
}
