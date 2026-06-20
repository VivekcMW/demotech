import { fetchPatientBundle, bundleResources, type FhirResource } from "../fhir/engine";

export interface DataFlowTransaction {
  transactionId: string;
  consentId: string;
  status: "INITIATED" | "TRANSFERRING" | "COMPLETED" | "FAILED";
  resourceCount?: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionStore = new Map<string, DataFlowTransaction>();

export async function pushHealthRecords(
  consentId: string,
  resources: FhirResource[],
): Promise<DataFlowTransaction> {
  console.warn("[ABDM Mock] pushHealthRecords — mock data push");
  const transactionId = `txn-${Date.now()}`;
  const bundle = bundleResources(resources);

  const transaction: DataFlowTransaction = {
    transactionId,
    consentId,
    status: "COMPLETED",
    resourceCount: resources.length,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  transactionStore.set(transactionId, transaction);

  return transaction;
}

export async function pullHealthRecords(
  consentId: string,
  hiTypes: string[],
): Promise<{ transactionId: string; resources: FhirResource[] }> {
  console.warn("[ABDM Mock] pullHealthRecords — mock data pull");
  const transactionId = `txn-${Date.now()}`;
  const patientResources: FhirResource[] = await fetchPatientBundle("mock-patient", hiTypes);

  const transaction: DataFlowTransaction = {
    transactionId,
    consentId,
    status: "COMPLETED",
    resourceCount: patientResources.length,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  transactionStore.set(transactionId, transaction);

  return { transactionId, resources: patientResources };
}

export async function getDataFlowStatus(transactionId: string): Promise<DataFlowTransaction | null> {
  console.warn("[ABDM Mock] getDataFlowStatus — mock status");
  return transactionStore.get(transactionId) || null;
}

export async function notifyDataFlow(notification: Record<string, unknown>): Promise<{ received: boolean }> {
  console.warn("[ABDM Mock] notifyDataFlow — mock notification");
  const txnId = notification?.transactionId as string | undefined;
  const status = notification?.status as string | undefined;

  if (txnId && status) {
    const existing = transactionStore.get(txnId);
    if (existing) {
      existing.status = status as DataFlowTransaction["status"];
      existing.updatedAt = new Date();
      transactionStore.set(txnId, existing);
    }
  }

  return { received: true };
}
