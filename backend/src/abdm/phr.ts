export interface SyncRecord {
  patientId: string;
  abhaId?: string;
  status: "IDLE" | "SYNCING" | "COMPLETED" | "FAILED";
  lastSyncedAt?: Date;
  error?: string;
  resourceTypes?: string[];
  syncInterval?: string;
}

const syncStore = new Map<string, SyncRecord>();

export async function syncToPHR(
  patientId: string,
  resourceTypes: string[],
): Promise<SyncRecord> {
  console.warn("[ABDM Mock] syncToPHR — mock PHR sync");
  const record: SyncRecord = {
    patientId,
    status: "COMPLETED",
    lastSyncedAt: new Date(),
    resourceTypes,
  };
  syncStore.set(patientId, record);
  return record;
}

export async function syncFromPHR(
  patientId: string,
  abhaId: string,
): Promise<SyncRecord> {
  console.warn("[ABDM Mock] syncFromPHR — mock PHR pull");
  const record: SyncRecord = {
    patientId,
    abhaId,
    status: "COMPLETED",
    lastSyncedAt: new Date(),
  };
  syncStore.set(patientId, record);
  return record;
}

export async function getSyncStatus(patientId: string): Promise<SyncRecord | null> {
  console.warn("[ABDM Mock] getSyncStatus — mock status check");
  return syncStore.get(patientId) || { patientId, status: "IDLE" };
}

export async function scheduleSync(
  patientId: string,
  interval: string,
): Promise<{ success: boolean; patientId: string; interval: string }> {
  console.warn("[ABDM Mock] scheduleSync — mock scheduling");
  const existing = syncStore.get(patientId) || { patientId, status: "IDLE" as const };
  existing.syncInterval = interval;
  syncStore.set(patientId, existing);
  return { success: true, patientId, interval };
}
