import { db } from "../db";
import { drugInteractions, drugInteractionCache, cdsAlerts } from "../db/schema";
import { and, eq, or, sql, desc } from "drizzle-orm";

const RXNAV_BASE = "https://rxnav.nlm.nih.gov/REST";

interface RxcuiResponse {
  idGroup?: { rxnormId?: string[] };
}

interface InteractionResponse {
  interactionTypeGroup?: {
    interactionType?: {
      comment?: string;
      interactionPair?: {
        severity: string;
        description: string;
        interactionConcept: {
          minConcept: { rxcui: string; name: string };
        }[];
      }[];
    }[];
  }[];
}

export async function lookupDrugRxcui(drugName: string): Promise<string | null> {
  const url = `${RXNAV_BASE}/drugs?name=${encodeURIComponent(drugName)}`;
  try {
    const res = await fetch(url);
    const data = await res.json() as RxcuiResponse;
    return data.idGroup?.rxnormId?.[0] || null;
  } catch {
    return null;
  }
}

export async function checkInteractionRemote(
  drugCode1: string,
  drugName1: string,
  drugCode2: string,
  drugName2: string,
): Promise<{
  severity: string;
  description: string;
  mechanism?: string;
  management?: string;
} | null> {
  const rxcui1 = await lookupDrugRxcui(drugName1);
  const rxcui2 = await lookupDrugRxcui(drugName2);
  if (!rxcui1 || !rxcui2) return null;

  const url = `${RXNAV_BASE}/interaction/list?rxcuis=${rxcui1}+${rxcui2}`;
  try {
    const res = await fetch(url);
    const data = await res.json() as InteractionResponse;
    const pair = data.interactionTypeGroup?.[0]?.interactionType?.[0]?.interactionPair?.[0];
    if (!pair) return null;

    return {
      severity: pair.severity?.toLowerCase() || "unknown",
      description: pair.description || "Potential interaction",
    };
  } catch {
    return null;
  }
}

export async function checkAndCacheInteraction(
  drugCode1: string,
  drugName1: string,
  drugCode2: string,
  drugName2: string,
): Promise<typeof drugInteractions.$inferSelect | null> {
  const key = [drugCode1, drugCode2].sort().join(":");

  const existing = await db.query.drugInteractions.findFirst({
    where: and(
      or(eq(drugInteractions.drugCode1, drugCode1), eq(drugInteractions.drugCode1, drugCode2)),
      or(eq(drugInteractions.drugCode2, drugCode1), eq(drugInteractions.drugCode2, drugCode2)),
    ),
  });
  if (existing) return existing;

  const remote = await checkInteractionRemote(drugCode1, drugName1, drugCode2, drugName2);
  if (!remote) return null;

  const id = `DDI-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [inserted] = await db.insert(drugInteractions).values({
    id,
    drugCode1, drugName1, drugCode2, drugName2,
    severity: remote.severity,
    description: remote.description,
    mechanism: remote.mechanism || null,
    management: remote.management || null,
  }).returning();

  return inserted;
}

export async function checkPrescriptionInteractions(
  items: { drugCode: string; drugName: string }[],
): Promise<{ drugA: string; drugB: string; severity: string; description: string }[]> {
  const results: { drugA: string; drugB: string; severity: string; description: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const interaction = await checkAndCacheInteraction(
        items[i].drugCode, items[i].drugName,
        items[j].drugCode, items[j].drugName,
      );
      if (interaction) {
        results.push({
          drugA: interaction.drugName1,
          drugB: interaction.drugName2,
          severity: interaction.severity,
          description: interaction.description,
        });
      }
    }
  }
  return results;
}

export async function checkDuplicateTherapy(
  patientId: string,
  newDrugCode: string,
): Promise<{ existing: string; severity: string } | null> {
  const existingRx = await db.query.rxItems.findFirst({
    where: eq(sql`${sql.identifier("drug_code")}`, newDrugCode),
  });
  if (existingRx) {
    return { existing: existingRx.drugName, severity: "warning" };
  }
  return null;
}

export async function createCdsAlert(data: {
  alertType: string;
  severity: string;
  message: string;
  patientId?: string;
  encounterId?: string;
  prescriptionId?: string;
  details?: Record<string, unknown>;
}): Promise<typeof cdsAlerts.$inferSelect> {
  const id = `CDS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [alert] = await db.insert(cdsAlerts).values({
    id,
    alertType: data.alertType,
    severity: data.severity,
    message: data.message,
    patientId: data.patientId || null,
    encounterId: data.encounterId || null,
    prescriptionId: data.prescriptionId || null,
    details: data.details as Record<string, unknown> || null,
  }).returning();
  return alert;
}

export async function acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
  const [result] = await db.update(cdsAlerts)
    .set({ acknowledgedBy: userId, acknowledgedAt: new Date() })
    .where(eq(cdsAlerts.id, alertId))
    .returning();
  return !!result;
}

export async function getPatientAlerts(patientId: string, unacknowledgedOnly = false) {
  const conditions = [eq(cdsAlerts.patientId, patientId)];
  if (unacknowledgedOnly) conditions.push(sql`${cdsAlerts.acknowledgedAt} IS NULL`);

  return db.query.cdsAlerts.findMany({
    where: and(...conditions),
    orderBy: [desc(cdsAlerts.createdAt)],
    limit: 100,
  });
}

export async function getDrugInteractionCache(drugCode: string) {
  return db.query.drugInteractionCache.findFirst({
    where: eq(drugInteractionCache.drugCode, drugCode),
  });
}
