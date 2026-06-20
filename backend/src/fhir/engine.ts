import { eq } from "drizzle-orm";
import { db, schema } from "../db";

// ── Helpers ──────────────────────────────────────────────────────────────

function fhirId(prefix: string, ehrId: string): string {
  return `${prefix}-${ehrId}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function buildName(parts: { given?: string; family?: string }) {
  const name: any = {};
  if (parts.given) name.given = [parts.given.split(/\s+/)[0]];
  if (parts.family) name.family = parts.family;
  if (parts.given) name.text = parts.given;
  return name;
}

function buildAddress(text?: string | null) {
  if (!text) return undefined;
  return [{ text, line: [text] }];
}

// ── Patient Mapper ───────────────────────────────────────────────────────

export function mapPatient(patient: typeof schema.patients.$inferSelect) {
  const identifiers: any[] = [
    { system: "urn:oid:1.2.3.4.5.6.7", value: patient.uhid, type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0203", code: "MR" }] } },
  ];
  if (patient.abhaId) {
    identifiers.push({ system: "https://abdm.gov.in/abha", value: patient.abhaId, type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0203", code: "NI" }] } });
  }

  const telecom: any[] = [];
  if (patient.phone) telecom.push({ system: "phone", value: patient.phone, use: "mobile" });
  if (patient.email) telecom.push({ system: "email", value: patient.email });
  if (patient.altPhone) telecom.push({ system: "phone", value: patient.altPhone, use: "home" });

  const resource: any = {
    resourceType: "Patient",
    id: fhirId("Patient", patient.id),
    identifier: identifiers,
    name: [buildName({ given: patient.name, family: patient.name.split(/\s+/).slice(1).join(" ") })],
    telecom,
    gender: patient.sex === "M" ? "male" : patient.sex === "F" ? "female" : "other",
    birthDate: patient.dob,
    address: buildAddress(patient.address),
    meta: {
      versionId: "1",
      lastUpdated: nowISO(),
    },
  };

  const nameParts = patient.name.split(/\s+/);
  const given = nameParts[0];
  const family = nameParts.slice(1).join(" ") || undefined;

  return {
    id: fhirId("Patient", patient.id),
    ehrId: patient.id,
    resource,
    searchName: patient.name.toLowerCase(),
    searchGiven: given?.toLowerCase(),
    searchFamily: family?.toLowerCase(),
    searchIdentifier: patient.uhid,
    searchBirthDate: patient.dob,
    searchGender: resource.gender,
    searchPhone: patient.phone,
    searchAbha: patient.abhaId?.toLowerCase(),
    versionId: 1,
  };
}

// ── Observation Mapper ───────────────────────────────────────────────────

export function mapVitalsObservation(vital: typeof schema.vitals.$inferSelect) {
  const obsId = fhirId("Observation", vital.id);
  const patientRef = `Patient/${fhirId("Patient", vital.patientId)}`;
  const encounterRef = `Encounter/${fhirId("Encounter", vital.encounterId)}`;

  const components: any[] = [];

  if (vital.bpSystolic != null) {
    components.push({
      code: { coding: [{ system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" }] },
      valueQuantity: { value: vital.bpSystolic, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
    });
  }
  if (vital.bpDiastolic != null) {
    components.push({
      code: { coding: [{ system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" }] },
      valueQuantity: { value: vital.bpDiastolic, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
    });
  }
  if (vital.hr != null) {
    components.push({
      code: { coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }] },
      valueQuantity: { value: vital.hr, unit: "/min", system: "http://unitsofmeasure.org", code: "/min" },
    });
  }
  if (vital.rr != null) {
    components.push({
      code: { coding: [{ system: "http://loinc.org", code: "9279-1", display: "Respiratory rate" }] },
      valueQuantity: { value: vital.rr, unit: "/min", system: "http://unitsofmeasure.org", code: "/min" },
    });
  }
  if (vital.temp != null) {
    components.push({
      code: { coding: [{ system: "http://loinc.org", code: "8310-5", display: "Body temperature" }] },
      valueQuantity: { value: Number(vital.temp), unit: "degC", system: "http://unitsofmeasure.org", code: "Cel" },
    });
  }
  if (vital.spo2 != null) {
    components.push({
      code: { coding: [{ system: "http://loinc.org", code: "2708-6", display: "Oxygen saturation in Arterial blood" }] },
      valueQuantity: { value: vital.spo2, unit: "%", system: "http://unitsofmeasure.org", code: "%" },
    });
  }
  if (vital.weight != null) {
    components.push({
      code: { coding: [{ system: "http://loinc.org", code: "29463-7", display: "Body weight" }] },
      valueQuantity: { value: Number(vital.weight), unit: "kg", system: "http://unitsofmeasure.org", code: "kg" },
    });
  }
  if (vital.height != null) {
    components.push({
      code: { coding: [{ system: "http://loinc.org", code: "8302-2", display: "Body height" }] },
      valueQuantity: { value: Number(vital.height), unit: "cm", system: "http://unitsofmeasure.org", code: "cm" },
    });
  }
  if (vital.bmi != null) {
    components.push({
      code: { coding: [{ system: "http://loinc.org", code: "39156-5", display: "Body mass index (BMI)" }] },
      valueQuantity: { value: Number(vital.bmi), unit: "kg/m2", system: "http://unitsofmeasure.org", code: "kg/m2" },
    });
  }

  const resource: any = {
    resourceType: "Observation",
    id: obsId,
    status: "final",
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs", display: "Vital Signs" }] }],
    code: {
      coding: [{ system: "http://loinc.org", code: "85353-1", display: "Vital signs panel" }],
      text: "Vital signs panel",
    },
    subject: { reference: patientRef },
    encounter: { reference: encounterRef },
    effectiveDateTime: vital.recordedAt.toISOString(),
    component: components,
    meta: { versionId: "1", lastUpdated: nowISO() },
  };

  return {
    id: obsId,
    ehrSource: "vitals" as const,
    ehrId: vital.id,
    patientId: vital.patientId,
    encounterId: vital.encounterId,
    resource,
    searchCode: "85353-1",
    searchCategory: "vital-signs",
    searchDate: vital.recordedAt.toISOString().slice(0, 10),
    searchStatus: "final",
    versionId: 1,
  };
}

export function mapLabObservation(lab: typeof schema.labOrders.$inferSelect) {
  const obsId = fhirId("Observation", lab.id);
  const patientRef = `Patient/${fhirId("Patient", lab.patientId)}`;
  const encounterRef = lab.encounterId ? `Encounter/${fhirId("Encounter", lab.encounterId)}` : undefined;

  const resource: any = {
    resourceType: "Observation",
    id: obsId,
    status: lab.status === "Completed" || lab.status === "Verified" ? "final" : lab.status === "Cancelled" ? "cancelled" : "preliminary",
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory", display: "Laboratory" }] }],
    code: {
      coding: [{ system: "urn:oid:2.16.840.1.113883.6.1", code: lab.id, display: lab.result ? (lab.result as any)?.testName || "Lab Test" : "Lab Test" }],
      text: lab.id,
    },
    subject: { reference: patientRef },
    ...(encounterRef ? { encounter: { reference: encounterRef } } : {}),
    effectiveDateTime: lab.collectedAt?.toISOString() || lab.createdAt.toISOString(),
    ...(lab.result ? { valueString: JSON.stringify(lab.result) } : {}),
    meta: { versionId: "1", lastUpdated: nowISO() },
  };
  if (lab.resultedAt) {
    resource.issued = lab.resultedAt.toISOString();
  }

  return {
    id: obsId,
    ehrSource: "lab_orders" as const,
    ehrId: lab.id,
    patientId: lab.patientId,
    encounterId: lab.encounterId,
    resource,
    searchCode: lab.id,
    searchCategory: "laboratory",
    searchDate: (lab.collectedAt || lab.createdAt).toISOString().slice(0, 10),
    searchStatus: resource.status,
    versionId: 1,
  };
}

// ── Encounter Mapper ─────────────────────────────────────────────────────

export function mapEncounter(encounter: typeof schema.encounters.$inferSelect) {
  const encId = fhirId("Encounter", encounter.id);
  const patientRef = `Patient/${fhirId("Patient", encounter.patientId)}`;

  const resource: any = {
    resourceType: "Encounter",
    id: encId,
    status: "finished",
    type: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/encounter-type", code: encounter.type, display: encounter.type }] }],
    subject: { reference: patientRef },
    period: { start: encounter.datetime.toISOString() },
    location: encounter.department ? [{ location: { display: encounter.department } }] : [],
    ...(encounter.doctorId ? { participant: [{ individual: { reference: `Practitioner/${encounter.doctorId}` } }] } : {}),
    meta: { versionId: "1", lastUpdated: nowISO() },
  };

  return {
    id: encId,
    ehrId: encounter.id,
    patientId: encounter.patientId,
    resource,
    searchDate: encounter.datetime.toISOString().slice(0, 10),
    searchType: encounter.type,
    searchStatus: "finished",
    searchDepartment: encounter.department,
    versionId: 1,
  };
}

// ── Condition Mapper ─────────────────────────────────────────────────────

export function mapCondition(diagnosis: typeof schema.diagnoses.$inferSelect, patientId: string) {
  const condId = fhirId("Condition", diagnosis.id);
  const patientRef = `Patient/${fhirId("Patient", patientId)}`;
  const encounterRef = `Encounter/${fhirId("Encounter", diagnosis.encounterId)}`;

  const clinicalStatus: string = diagnosis.certainty === "Confirmed" ? "active" : "resolved";
  const verificationStatus = diagnosis.certainty === "Confirmed" ? "confirmed" : "unconfirmed";

  const resource: any = {
    resourceType: "Condition",
    id: condId,
    clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: clinicalStatus }] },
    verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: verificationStatus }] },
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "encounter-diagnosis", display: "Encounter Diagnosis" }] }],
    code: {
      coding: [{ system: "http://hl7.org/fhir/sid/icd-10", code: diagnosis.icdCode, display: diagnosis.description }],
      text: diagnosis.description,
    },
    subject: { reference: patientRef },
    encounter: { reference: encounterRef },
    meta: { versionId: "1", lastUpdated: nowISO() },
  };

  return {
    id: condId,
    encounterId: diagnosis.encounterId,
    patientId,
    resource,
    searchCode: diagnosis.icdCode,
    searchClinicalStatus: clinicalStatus,
    searchVerificationStatus: verificationStatus,
    searchCategory: "encounter-diagnosis",
    versionId: 1,
  };
}

// ── MedicationRequest Mapper ─────────────────────────────────────────────

export function mapMedicationRequest(
  prescription: typeof schema.prescriptions.$inferSelect,
  rxItems: (typeof schema.rxItems.$inferSelect)[],
) {
  const mrId = fhirId("MedicationRequest", prescription.id);
  const patientRef = `Patient/${fhirId("Patient", prescription.patientId)}`;
  const encounterRef = prescription.encounterId ? `Encounter/${fhirId("Encounter", prescription.encounterId)}` : undefined;

  const medicationCodeableConcept = rxItems.length === 1
    ? { coding: [{ system: "urn:oid:2.16.840.1.113883.6.69", code: rxItems[0].drugCode, display: rxItems[0].drugName }], text: rxItems[0].drugName }
    : { text: rxItems.map((i) => i.drugName).join(" + ") };

  const dosageInstruction = rxItems.map((item) => ({
    text: `${item.drugName} ${item.dosage}, ${item.frequency}${item.duration ? ` for ${item.duration}` : ""}`,
    timing: { code: { text: item.frequency } },
    doseAndRate: [{ doseQuantity: { value: parseFloat(item.dosage) || 0, unit: item.dosage.replace(/[\d.]/g, "") || "dose" } }],
    route: item.route ? { coding: [{ code: item.route, display: item.route }] } : undefined,
  }));

  const statusMap: Record<string, string> = {
    "Pending": "active",
    "Verified": "active",
    "Dispensing": "active",
    "Dispensed": "completed",
    "Partially Dispensed": "active",
    "On Hold": "on-hold",
    "Cancelled": "cancelled",
  };

  const resource: any = {
    resourceType: "MedicationRequest",
    id: mrId,
    status: statusMap[prescription.status] || "active",
    intent: "order",
    medicationCodeableConcept,
    subject: { reference: patientRef },
    ...(encounterRef ? { encounter: { reference: encounterRef } } : {}),
    authoredOn: prescription.createdAt.toISOString(),
    dosageInstruction,
    meta: { versionId: "1", lastUpdated: nowISO() },
  };

  return {
    id: mrId,
    ehrId: prescription.id,
    patientId: prescription.patientId,
    encounterId: prescription.encounterId,
    resource,
    searchStatus: resource.status,
    searchMedication: rxItems.map((i) => i.drugName.toLowerCase()).join(" "),
    versionId: 1,
  };
}

// ── DiagnosticReport Mapper ──────────────────────────────────────────────

export function mapDiagnosticReport(lab: typeof schema.labOrders.$inferSelect) {
  const drId = fhirId("DiagnosticReport", lab.id);
  const patientRef = `Patient/${fhirId("Patient", lab.patientId)}`;
  const encounterRef = lab.encounterId ? `Encounter/${fhirId("Encounter", lab.encounterId)}` : undefined;

  const statusMap: Record<string, string> = {
    "Ordered": "registered",
    "Collected": "partial",
    "Processing": "partial",
    "Completed": "final",
    "Verified": "final",
    "Cancelled": "cancelled",
  };

  const resultRef = `Observation/${fhirId("Observation", lab.id)}`;

  const resource: any = {
    resourceType: "DiagnosticReport",
    id: drId,
    status: statusMap[lab.status] || "registered",
    category: [{ coding: [{ system: "http://loinc.org", code: "LP29684-5", display: "Laboratory" }] }],
    code: {
      coding: [{ system: "urn:oid:2.16.840.1.113883.6.1", code: lab.id, display: lab.result ? (lab.result as any)?.testName || "Lab Test" : "Lab Test" }],
      text: lab.id,
    },
    subject: { reference: patientRef },
    ...(encounterRef ? { encounter: { reference: encounterRef } } : {}),
    effectiveDateTime: lab.collectedAt?.toISOString() || lab.createdAt.toISOString(),
    issued: (lab.resultedAt || lab.createdAt).toISOString(),
    result: [{ reference: resultRef }],
    ...(lab.result ? { presentedForm: [{ data: Buffer.from(JSON.stringify(lab.result)).toString("base64"), contentType: "application/json" }] } : {}),
    meta: { versionId: "1", lastUpdated: nowISO() },
  };

  return {
    id: drId,
    ehrId: lab.id,
    patientId: lab.patientId,
    encounterId: lab.encounterId,
    resource,
    searchCode: lab.id,
    searchCategory: "laboratory",
    searchDate: (lab.collectedAt || lab.createdAt).toISOString().slice(0, 10),
    searchStatus: resource.status,
    versionId: 1,
  };
}

// ── ImagingStudy Mapper ──────────────────────────────────────────────────

export function mapImagingStudy(study: typeof schema.imagingStudies.$inferSelect) {
  const isId = fhirId("ImagingStudy", study.id);
  const patientRef = `Patient/${fhirId("Patient", study.patientId)}`;
  const encounterRef = study.encounterId ? `Encounter/${fhirId("Encounter", study.encounterId)}` : undefined;

  const resource: any = {
    resourceType: "ImagingStudy",
    id: isId,
    status: study.status?.toLowerCase() || "available",
    subject: { reference: patientRef },
    ...(encounterRef ? { encounter: { reference: encounterRef } } : {}),
    ...(study.studyUid ? { identifier: [{ system: "urn:dicom:uid", value: study.studyUid }] } : {}),
    ...(study.modality ? { modality: [{ coding: [{ system: "http://dicom.nema.org/resources/ontology/DCM", code: study.modality, display: study.modality }] }] } : {}),
    description: study.description,
    numberOfSeries: study.seriesCount || 0,
    ...(study.dicomMetadata ? { extension: [{ url: "https://aarogya.ehr/dicom-metadata", valueCode: JSON.stringify(study.dicomMetadata) }] } : {}),
    meta: { versionId: "1", lastUpdated: nowISO() },
  };

  return {
    id: isId,
    ehrId: study.id,
    patientId: study.patientId,
    encounterId: study.encounterId,
    resource,
    searchModality: study.modality?.toLowerCase(),
    searchDate: study.createdAt.toISOString().slice(0, 10),
    versionId: 1,
  };
}

// ── Sync Functions ───────────────────────────────────────────────────────

async function upsertPatient(patientId: string): Promise<void> {
  const [patient] = await db.select().from(schema.patients).where(eq(schema.patients.id, patientId)).limit(1);
  if (!patient) throw new Error(`Patient not found: ${patientId}`);

  const row = mapPatient(patient);
  await db.insert(schema.fhirPatients).values(row).onConflictDoUpdate({
    target: schema.fhirPatients.id,
    set: {
      resource: row.resource,
      searchName: row.searchName,
      searchGiven: row.searchGiven,
      searchFamily: row.searchFamily,
      searchIdentifier: row.searchIdentifier,
      searchBirthDate: row.searchBirthDate,
      searchGender: row.searchGender,
      searchPhone: row.searchPhone,
      searchAbha: row.searchAbha,
      versionId: row.versionId,
      lastSyncedAt: new Date(),
    },
  });
}

async function upsertObservations(patientId: string): Promise<void> {
  const vitalsList = await db.select().from(schema.vitals).where(eq(schema.vitals.patientId, patientId));
  for (const v of vitalsList) {
    const row = mapVitalsObservation(v);
    await db.insert(schema.fhirObservations).values(row).onConflictDoUpdate({
      target: schema.fhirObservations.id,
      set: {
        resource: row.resource,
        searchCode: row.searchCode,
        searchCategory: row.searchCategory,
        searchDate: row.searchDate,
        searchStatus: row.searchStatus,
        versionId: row.versionId,
        lastSyncedAt: new Date(),
      },
    });
  }

  const labList = await db.select().from(schema.labOrders).where(eq(schema.labOrders.patientId, patientId));
  for (const lab of labList) {
    const obsRow = mapLabObservation(lab);
    await db.insert(schema.fhirObservations).values(obsRow).onConflictDoUpdate({
      target: schema.fhirObservations.id,
      set: {
        resource: obsRow.resource,
        searchCode: obsRow.searchCode,
        searchCategory: obsRow.searchCategory,
        searchDate: obsRow.searchDate,
        searchStatus: obsRow.searchStatus,
        versionId: obsRow.versionId,
        lastSyncedAt: new Date(),
      },
    });
  }
}

async function upsertEncounters(patientId: string): Promise<void> {
  const encountersList = await db.select().from(schema.encounters).where(eq(schema.encounters.patientId, patientId));
  for (const enc of encountersList) {
    const row = mapEncounter(enc);
    await db.insert(schema.fhirEncounters).values(row).onConflictDoUpdate({
      target: schema.fhirEncounters.id,
      set: {
        resource: row.resource,
        searchDate: row.searchDate,
        searchType: row.searchType,
        searchStatus: row.searchStatus,
        searchDepartment: row.searchDepartment,
        versionId: row.versionId,
        lastSyncedAt: new Date(),
      },
    });
  }
}

async function upsertConditions(patientId: string): Promise<void> {
  const diagnosesList = await db
    .select({ diagnosis: schema.diagnoses })
    .from(schema.diagnoses)
    .innerJoin(schema.encounters, eq(schema.diagnoses.encounterId, schema.encounters.id))
    .where(eq(schema.encounters.patientId, patientId));
  for (const { diagnosis: d } of diagnosesList) {
    const row = mapCondition(d, patientId);
    await db.insert(schema.fhirConditions).values(row).onConflictDoUpdate({
      target: schema.fhirConditions.id,
      set: {
        resource: row.resource,
        searchCode: row.searchCode,
        searchClinicalStatus: row.searchClinicalStatus,
        searchVerificationStatus: row.searchVerificationStatus,
        searchCategory: row.searchCategory,
        versionId: row.versionId,
        lastSyncedAt: new Date(),
      },
    });
  }
}

async function upsertMedicationRequests(patientId: string): Promise<void> {
  const prescList = await db.select().from(schema.prescriptions).where(eq(schema.prescriptions.patientId, patientId));
  for (const rx of prescList) {
    const items = await db.select().from(schema.rxItems).where(eq(schema.rxItems.prescriptionId, rx.id));
    const row = mapMedicationRequest(rx, items);
    await db.insert(schema.fhirMedicationRequests).values(row).onConflictDoUpdate({
      target: schema.fhirMedicationRequests.id,
      set: {
        resource: row.resource,
        searchStatus: row.searchStatus,
        searchMedication: row.searchMedication,
        versionId: row.versionId,
        lastSyncedAt: new Date(),
      },
    });
  }
}

async function upsertDiagnosticReports(patientId: string): Promise<void> {
  const labList = await db.select().from(schema.labOrders).where(eq(schema.labOrders.patientId, patientId));
  for (const lab of labList) {
    const row = mapDiagnosticReport(lab);
    await db.insert(schema.fhirDiagnosticReports).values(row).onConflictDoUpdate({
      target: schema.fhirDiagnosticReports.id,
      set: {
        resource: row.resource,
        searchCode: row.searchCode,
        searchCategory: row.searchCategory,
        searchDate: row.searchDate,
        searchStatus: row.searchStatus,
        versionId: row.versionId,
        lastSyncedAt: new Date(),
      },
    });
  }
}

async function upsertImagingStudies(patientId: string): Promise<void> {
  const studies = await db.select().from(schema.imagingStudies).where(eq(schema.imagingStudies.patientId, patientId));
  for (const study of studies) {
    const row = mapImagingStudy(study);
    await db.insert(schema.fhirImagingStudies).values(row).onConflictDoUpdate({
      target: schema.fhirImagingStudies.id,
      set: {
        resource: row.resource,
        searchModality: row.searchModality,
        searchDate: row.searchDate,
        versionId: row.versionId,
        lastSyncedAt: new Date(),
      },
    });
  }
}

export interface FhirResource {
  resourceType: string;
  id: string;
  [key: string]: unknown;
}

export async function fetchPatientBundle(patientId: string, resourceTypes?: string[]): Promise<FhirResource[]> {
  const resources: FhirResource[] = [];
  const patient = await db.select().from(schema.patients).where(eq(schema.patients.id, patientId)).limit(1);
  if (!patient.length) return resources;

  resources.push(mapPatient(patient[0]).resource as FhirResource);

  const encList = await db.select().from(schema.encounters).where(eq(schema.encounters.patientId, patientId));
  for (const enc of encList) resources.push(mapEncounter(enc).resource as FhirResource);

  const vitals = await db.select().from(schema.vitals).where(eq(schema.vitals.patientId, patientId));
  for (const v of vitals) resources.push(mapVitalsObservation(v).resource as FhirResource);

  const labs = await db.select().from(schema.labOrders).where(eq(schema.labOrders.patientId, patientId));
  for (const l of labs) {
    resources.push(mapLabObservation(l).resource as FhirResource);
    resources.push(mapDiagnosticReport(l).resource as FhirResource);
  }

  const diags = await db
    .select({ d: schema.diagnoses })
    .from(schema.diagnoses)
    .innerJoin(schema.encounters, eq(schema.diagnoses.encounterId, schema.encounters.id))
    .where(eq(schema.encounters.patientId, patientId));
  for (const { d } of diags) resources.push(mapCondition(d, patientId).resource as FhirResource);

  const rxs = await db.select().from(schema.prescriptions).where(eq(schema.prescriptions.patientId, patientId));
  for (const rx of rxs) {
    const items = await db.select().from(schema.rxItems).where(eq(schema.rxItems.prescriptionId, rx.id));
    resources.push(mapMedicationRequest(rx, items).resource as FhirResource);
  }

  const studies = await db.select().from(schema.imagingStudies).where(eq(schema.imagingStudies.patientId, patientId));
  for (const s of studies) resources.push(mapImagingStudy(s).resource as FhirResource);

  return resources;
}

export function bundleResources(resources: FhirResource[]): Record<string, unknown> {
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: resources.map((r) => ({ resource: r })),
  };
}

// ── Public API ───────────────────────────────────────────────────────────

export async function syncPatient(patientId: string): Promise<void> {
  await upsertPatient(patientId);
  await Promise.all([
    upsertObservations(patientId),
    upsertEncounters(patientId),
    upsertConditions(patientId),
    upsertMedicationRequests(patientId),
    upsertDiagnosticReports(patientId),
    upsertImagingStudies(patientId),
  ]);
}

export async function syncAll(): Promise<{ synced: number; errors: { patientId: string; error: string }[] }> {
  const allPatients = await db.select({ id: schema.patients.id }).from(schema.patients);
  const errors: { patientId: string; error: string }[] = [];
  let synced = 0;

  for (const { id } of allPatients) {
    try {
      await syncPatient(id);
      synced++;
    } catch (err: any) {
      errors.push({ patientId: id, error: err.message || String(err) });
    }
  }

  return { synced, errors };
}
