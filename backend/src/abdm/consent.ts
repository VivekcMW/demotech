export interface ConsentRequest {
  id: string;
  patientAbha: string;
  hipId: string;
  purpose: string;
  fromDate: string;
  toDate: string;
  status: "REQUESTED" | "GRANTED" | "REVOKED" | "EXPIRED";
  artefact?: ConsentArtefact;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentArtefact {
  consentId: string;
  consentManagerId: string;
  patient: { abha: string; name: string };
  hip: { id: string; name: string };
  purpose: { text: string; code: string };
  permission: {
    accessMode: "VIEW" | "STORE" | "VIEW_AND_STORE";
    dateRange: { from: string; to: string };
    dataTypes: string[];
  };
  signature: string;
  status: "GRANTED" | "REVOKED" | "EXPIRED";
}

const consentStore = new Map<string, ConsentRequest>();
const consentArtefactStore = new Map<string, ConsentArtefact>();

export async function requestConsent(
  patientAbha: string,
  hipId: string,
  purpose: string,
  fromDate: string,
  toDate: string,
): Promise<ConsentRequest> {
  console.warn("[ABDM Mock] requestConsent — mock consent request");
  const id = `consent-${Date.now()}`;
  const request: ConsentRequest = {
    id,
    patientAbha,
    hipId,
    purpose,
    fromDate,
    toDate,
    status: "REQUESTED",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  consentStore.set(id, request);
  return request;
}

export async function getConsentStatus(consentId: string): Promise<ConsentRequest | null> {
  console.warn("[ABDM Mock] getConsentStatus — mock status check");
  return consentStore.get(consentId) || null;
}

export async function notifyConsentAction(notification: Record<string, unknown>): Promise<{ received: boolean }> {
  console.warn("[ABDM Mock] notifyConsentAction — mock notification processing");
  const consentId = (notification?.consentId || notification?.consentRequestId) as string | undefined;
  const status = notification?.status as string | undefined;

  if (consentId && status) {
    const existing = consentStore.get(consentId);
    if (existing) {
      existing.status = status as ConsentRequest["status"];
      existing.updatedAt = new Date();
      consentStore.set(consentId, existing);
    }
  }

  return { received: true };
}

export async function revokeConsent(consentId: string): Promise<{ success: boolean }> {
  console.warn("[ABDM Mock] revokeConsent — mock revocation");
  const existing = consentStore.get(consentId);
  if (existing) {
    existing.status = "REVOKED";
    existing.updatedAt = new Date();
    consentStore.set(consentId, existing);
  }
  return { success: true };
}

export async function listActiveConsents(patientAbha: string): Promise<ConsentRequest[]> {
  console.warn("[ABDM Mock] listActiveConsents — mock listing");
  const consents: ConsentRequest[] = [];
  for (const consent of consentStore.values()) {
    if (consent.patientAbha === patientAbha && consent.status === "GRANTED") {
      consents.push(consent);
    }
  }
  return consents;
}

export async function storeConsentArtefact(artefact: ConsentArtefact): Promise<{ success: boolean }> {
  console.warn("[ABDM Mock] storeConsentArtefact — storing artefact");
  consentArtefactStore.set(artefact.consentId, artefact);
  const existing = consentStore.get(artefact.consentId);
  if (existing) {
    existing.artefact = artefact;
    existing.status = artefact.status;
    existing.updatedAt = new Date();
    consentStore.set(artefact.consentId, existing);
  }
  return { success: true };
}
