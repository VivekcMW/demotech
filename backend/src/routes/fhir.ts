import { Hono } from "hono";
import { eq, sql, and, asc, desc, like, gte, lte, inArray } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db, schema } from "../db";
import { parseSearchParams, type SearchParams } from "../fhir/search";
import { validateResource, type OperationOutcome } from "../fhir/validation";
import { buildBundle, buildOperationOutcome, type BundleEntry, type FHIRBundle } from "../fhir/bundle";

const fhir = new Hono();

const FHIR_MIME = "application/fhir+json; charset=utf-8";
const BASE_URL = process.env.FHIR_BASE_URL || "http://localhost:4000/api/fhir/r4";

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": FHIR_MIME },
  });
}

const SUBSCRIPTIONS = new Map<string, any>();

// ── Resource Transformers ─────────────────────────────────────────────────────

function patientToFhir(row: typeof schema.patients.$inferSelect): any {
  const identifiers: any[] = [
    { system: "http://aarogyaehr.in/uhid", value: row.uhid },
  ];
  if (row.abhaId) {
    identifiers.push({
      system: "https://abdm.gov.in/abha",
      value: row.abhaId,
    });
  }

  const telecom: any[] = [];
  if (row.phone) telecom.push({ system: "phone", value: row.phone, use: "mobile" });
  if (row.altPhone) telecom.push({ system: "phone", value: row.altPhone, use: "home" });
  if (row.email) telecom.push({ system: "email", value: row.email });

  const genderMap: Record<string, string> = { M: "male", F: "female", O: "other" };

  const resource: any = {
    resourceType: "Patient",
    id: row.id,
    identifier: identifiers,
    name: [{ use: "official", text: row.name }],
    gender: genderMap[row.sex] || "unknown",
    birthDate: row.dob,
    telecom: telecom.length > 0 ? telecom : undefined,
    address: row.address ? [{ text: row.address }] : undefined,
    meta: {
      lastUpdated: row.updatedAt?.toISOString() || row.createdAt?.toISOString(),
    },
  };

  if (row.bloodGroup) {
    resource.extension = [
      {
        url: "http://aarogyaehr.in/StructureDefinition/blood-group",
        valueString: row.bloodGroup,
      },
    ];
  }

  return resource;
}

function fhirPatientToDb(resource: any): any {
  const genderMap: Record<string, string> = { male: "M", female: "F", other: "O", unknown: "O" };
  const name = resource.name?.[0]?.text || resource.name?.[0]?.given?.join(" ") || "";
  const family = resource.name?.[0]?.family || "";
  const fullName = [name, family].filter(Boolean).join(" ") || "Unknown";
  const phone = resource.telecom?.find((t: any) => t.system === "phone")?.value || "";
  const email = resource.telecom?.find((t: any) => t.system === "email")?.value || null;
  const address = resource.address?.[0]?.text || resource.address?.[0]?.line?.join(", ") || null;

  const identifierUhid = resource.identifier?.find(
    (i: any) => i.system === "http://aarogyaehr.in/uhid",
  )?.value;
  const identifierAbha = resource.identifier?.find(
    (i: any) => i.system?.includes("abha") || i.system?.includes("abdm"),
  )?.value;

  return {
    id: resource.id,
    uhid: identifierUhid || resource.id,
    abhaId: identifierAbha || null,
    name: fullName,
    age: 0,
    dob: resource.birthDate || "2000-01-01",
    sex: genderMap[resource.gender] || "O",
    bloodGroup: "O+",
    phone,
    email,
    address,
    registeredAt: new Date(),
  };
}

function encounterToFhir(row: typeof schema.encounters.$inferSelect): any {
  return {
    resourceType: "Encounter",
    id: row.id,
    status: "finished",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: row.type === "Telemedicine" ? "VR" : row.type === "Emergency" ? "EMER" : row.type === "IPD" ? "IMP" : "AMB",
      display: row.type,
    },
    type: [{ coding: [{ system: "http://aarogyaehr.in/encounter-type", code: row.type }] }],
    subject: { reference: `Patient/${row.patientId}` },
    participant: row.doctorId ? [{ individual: { reference: `Practitioner/${row.doctorId}` } }] : undefined,
    period: { start: row.datetime.toISOString() },
    reasonCode: row.chiefComplaint ? [{ text: row.chiefComplaint }] : undefined,
    diagnosis: undefined,
    meta: { lastUpdated: row.createdAt?.toISOString() },
  };
}

function observationVitalsToFhir(vital: typeof schema.vitals.$inferSelect): any[] {
  const patientRef = { reference: `Patient/${vital.patientId}` };
  const encounterRef = vital.encounterId ? { reference: `Encounter/${vital.encounterId}` } : undefined;
  const base: any = {
    subject: patientRef,
    encounter: encounterRef,
    effectiveDateTime: vital.recordedAt?.toISOString(),
    meta: { lastUpdated: vital.recordedAt?.toISOString() },
  };

  const observations: any[] = [];
  const components: Array<{ code: any; value: any; unit: string }> = [];

  if (vital.bpSystolic != null) {
    components.push({
      code: { coding: [{ system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" }] },
      value: { value: vital.bpSystolic, unit: "mm[Hg]" },
      unit: "mm[Hg]",
    });
  }
  if (vital.bpDiastolic != null) {
    components.push({
      code: { coding: [{ system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" }] },
      value: { value: vital.bpDiastolic, unit: "mm[Hg]" },
      unit: "mm[Hg]",
    });
  }
  if (components.length >= 2) {
    observations.push({
      resourceType: "Observation",
      id: `vital-bp-${vital.id}`,
      status: "final",
      code: { coding: [{ system: "http://loinc.org", code: "85354-9", display: "Blood pressure panel" }], text: "Blood pressure" },
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs", display: "Vital Signs" }] }],
      component: components.map((c) => ({
        code: c.code,
        valueQuantity: { value: c.value.value, unit: c.unit, system: "http://unitsofmeasure.org", code: c.unit },
      })),
      ...base,
    });
  }

  const vitalObs: Array<{ loinc: string; display: string; value: any; unit: string }> = [
    vital.hr != null ? { loinc: "8867-4", display: "Heart rate", value: { value: vital.hr }, unit: "/min" } : null,
    vital.rr != null ? { loinc: "9279-1", display: "Respiratory rate", value: { value: vital.rr }, unit: "/min" } : null,
    vital.temp != null ? { loinc: "8310-5", display: "Body temperature", value: { value: Number(vital.temp) }, unit: "Cel" } : null,
    vital.spo2 != null ? { loinc: "2708-6", display: "Oxygen saturation", value: { value: vital.spo2 }, unit: "%" } : null,
    vital.weight != null ? { loinc: "29463-7", display: "Body weight", value: { value: Number(vital.weight) }, unit: "kg" } : null,
    vital.height != null ? { loinc: "8302-2", display: "Body height", value: { value: Number(vital.height) }, unit: "cm" } : null,
    vital.bmi != null ? { loinc: "39156-5", display: "Body mass index", value: { value: Number(vital.bmi) }, unit: "kg/m2" } : null,
  ].filter(Boolean) as Array<{ loinc: string; display: string; value: any; unit: string }>;

  for (const vo of vitalObs) {
    observations.push({
      resourceType: "Observation",
      id: `vital-${vo.loinc.replace(/[^a-zA-Z0-9]/g, "-")}-${vital.id}`,
      status: "final",
      code: { coding: [{ system: "http://loinc.org", code: vo.loinc, display: vo.display }], text: vo.display },
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs", display: "Vital Signs" }] }],
      valueQuantity: { value: vo.value.value, unit: vo.unit, system: "http://unitsofmeasure.org", code: vo.unit },
      ...base,
    });
  }

  return observations;
}

function labOrderToObservation(row: typeof schema.labOrders.$inferSelect, catalog?: typeof schema.labTestCatalog.$inferSelect): any {
  let valueObs: any = {
    valueString: row.notes || "See attached report",
  };
  if (row.result && typeof row.result === "object") {
    valueObs = {
      valueQuantity: { value: (row.result as any).value, unit: (row.result as any).unit },
    };
  }

  return {
    resourceType: "Observation",
    id: `lab-${row.id}`,
    status: row.status === "Completed" || row.status === "Verified" ? "final" : row.status === "Cancelled" ? "cancelled" : "preliminary",
    code: {
      coding: [{ system: "http://aarogyaehr.in/lab-test", code: row.testId, display: catalog?.name || row.testId }],
      text: catalog?.name || row.testId,
    },
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory", display: "Laboratory" }] }],
    subject: { reference: `Patient/${row.patientId}` },
    encounter: row.encounterId ? { reference: `Encounter/${row.encounterId}` } : undefined,
    effectiveDateTime: row.collectedAt?.toISOString(),
    issued: row.resultedAt?.toISOString(),
    performer: row.resultedBy ? [{ reference: `Practitioner/${row.resultedBy}` }] : undefined,
    ...valueObs,
    meta: { lastUpdated: row.createdAt?.toISOString() },
  };
}

function diagnosisToCondition(row: typeof schema.diagnoses.$inferSelect): any {
  const statusMap: Record<string, string> = {
    Confirmed: "active",
    Suspected: "suspected",
    "Rule Out": "active",
  };

  return {
    resourceType: "Condition",
    id: row.id,
    clinicalStatus: {
      coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: statusMap[row.certainty] || "active" }],
    },
    verificationStatus: {
      coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: row.certainty === "Confirmed" ? "confirmed" : "unconfirmed" }],
    },
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: row.type === "Primary" ? "problem-list-item" : "encounter-diagnosis" }] }],
    code: {
      coding: [{ system: "http://hl7.org/fhir/sid/icd-10", code: row.icdCode, display: row.description }],
      text: row.description,
    },
    subject: { reference: `Patient/` },
    encounter: { reference: `Encounter/${row.encounterId}` },
    meta: { lastUpdated: row.createdAt?.toISOString() },
  };
}

function prescriptionToMedicationRequest(
  rx: typeof schema.prescriptions.$inferSelect,
  items: Array<typeof schema.rxItems.$inferSelect>,
): any {
  const dosageInstructions = items.map((item) => ({
    text: `${item.drugName} ${item.dosage}, ${item.frequency} for ${item.duration || "as directed"}`,
    timing: { code: { text: item.frequency } },
    doseAndRate: [{ doseQuantity: { value: item.quantity, unit: item.dosage } }],
  }));

  return {
    resourceType: "MedicationRequest",
    id: rx.id,
    status: rx.status === "Cancelled" ? "cancelled" : rx.status === "Dispensed" || rx.status === "Partially Dispensed" ? "active" : "active",
    intent: "order",
    medicationCodeableConcept: {
      coding: items.map((item) => ({
        system: "http://aarogyaehr.in/drug",
        code: item.drugCode,
        display: item.drugName,
      })),
      text: items.map((i) => i.drugName).join(", "),
    },
    subject: { reference: `Patient/${rx.patientId}` },
    authoredOn: rx.createdAt?.toISOString(),
    requester: rx.doctorId ? { reference: `Practitioner/${rx.doctorId}` } : undefined,
    dosageInstruction: dosageInstructions,
    meta: { lastUpdated: rx.createdAt?.toISOString() },
  };
}

function imagingStudyToFhir(row: typeof schema.imagingStudies.$inferSelect): any {
  return {
    resourceType: "ImagingStudy",
    id: row.id,
    status: row.status || "available",
    subject: { reference: `Patient/${row.patientId}` },
    encounter: row.encounterId ? { reference: `Encounter/${row.encounterId}` } : undefined,
    identifier: row.studyUid ? [{ system: "urn:dicom:uid", value: row.studyUid }] : undefined,
    modality: row.modality ? [{ system: "http://dicom.nema.org/resources/ontology/DCM", code: row.modality }] : undefined,
    description: row.description,
    numberOfSeries: row.seriesCount,
    report: row.report ? [{ display: row.report }] : undefined,
    meta: { lastUpdated: row.createdAt?.toISOString() },
  };
}

// ── CapabilityStatement ──────────────────────────────────────────────────────

export function capabilityStatement(): any {
  return {
    resourceType: "CapabilityStatement",
    status: "active",
    date: new Date().toISOString(),
    publisher: "AarogyaEHR",
    kind: "instance",
    software: {
      name: "AarogyaEHR FHIR Server",
      version: process.env.npm_package_version || "0.1.0",
      releaseDate: new Date().toISOString(),
    },
    fhirVersion: "4.0.1",
    format: ["application/fhir+json", "application/json"],
    rest: [
      {
        mode: "server",
        documentation: "AarogyaEHR FHIR R4 API",
        security: {
          cors: true,
          service: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/restful-security-service",
                  code: "SMART-on-FHIR",
                  display: "SMART-on-FHIR",
                },
              ],
              text: "OAuth 2.0 / JWT authentication",
            },
          ],
          description: "Authentication via JWT tokens issued by the AarogyaEHR auth service",
        },
        resource: [
          {
            type: "Patient",
            profile: "http://hl7.org/fhir/StructureDefinition/Patient",
            interaction: [
              { code: "read" },
              { code: "search-type" },
              { code: "create" },
              { code: "update" },
            ],
            searchParam: [
              { name: "_id", type: "token", documentation: "Resource ID" },
              { name: "identifier", type: "token", documentation: "The patient's identifier (UHID, ABHA)" },
              { name: "name", type: "string", documentation: "A portion of the patient's name" },
              { name: "birthdate", type: "date", documentation: "The patient's date of birth" },
              { name: "gender", type: "token", documentation: "The patient's gender" },
              { name: "phone", type: "token", documentation: "The patient's phone number" },
              { name: "email", type: "token", documentation: "The patient's email" },
            ],
          },
          {
            type: "Observation",
            profile: "http://hl7.org/fhir/StructureDefinition/Observation",
            interaction: [
              { code: "read" },
              { code: "search-type" },
              { code: "create" },
            ],
            searchParam: [
              { name: "_id", type: "token" },
              { name: "patient", type: "reference" },
              { name: "code", type: "token" },
              { name: "category", type: "token" },
              { name: "date", type: "date" },
              { name: "status", type: "token" },
            ],
          },
          {
            type: "Encounter",
            profile: "http://hl7.org/fhir/StructureDefinition/Encounter",
            interaction: [
              { code: "read" },
              { code: "search-type" },
              { code: "create" },
            ],
            searchParam: [
              { name: "_id", type: "token" },
              { name: "patient", type: "reference" },
              { name: "date", type: "date" },
              { name: "type", type: "token" },
              { name: "status", type: "token" },
            ],
          },
          {
            type: "Condition",
            profile: "http://hl7.org/fhir/StructureDefinition/Condition",
            interaction: [
              { code: "read" },
              { code: "search-type" },
            ],
            searchParam: [
              { name: "_id", type: "token" },
              { name: "patient", type: "reference" },
              { name: "code", type: "token" },
              { name: "clinical-status", type: "token" },
              { name: "encounter", type: "reference" },
            ],
          },
          {
            type: "MedicationRequest",
            profile: "http://hl7.org/fhir/StructureDefinition/MedicationRequest",
            interaction: [
              { code: "read" },
              { code: "search-type" },
            ],
            searchParam: [
              { name: "_id", type: "token" },
              { name: "patient", type: "reference" },
              { name: "status", type: "token" },
              { name: "authored-on", type: "date" },
            ],
          },
          {
            type: "DiagnosticReport",
            profile: "http://hl7.org/fhir/StructureDefinition/DiagnosticReport",
            interaction: [
              { code: "read" },
              { code: "search-type" },
              { code: "create" },
            ],
            searchParam: [
              { name: "_id", type: "token" },
              { name: "patient", type: "reference" },
              { name: "code", type: "token" },
              { name: "date", type: "date" },
              { name: "status", type: "token" },
            ],
          },
          {
            type: "ImagingStudy",
            profile: "http://hl7.org/fhir/StructureDefinition/ImagingStudy",
            interaction: [
              { code: "read" },
              { code: "search-type" },
              { code: "create" },
            ],
            searchParam: [
              { name: "_id", type: "token" },
              { name: "patient", type: "reference" },
              { name: "modality", type: "token" },
              { name: "date", type: "date" },
            ],
          },
          {
            type: "Subscription",
            profile: "http://hl7.org/fhir/StructureDefinition/Subscription",
            interaction: [
              { code: "read" },
              { code: "search-type" },
              { code: "create" },
            ],
          },
        ],
      },
    ],
  };
}

// ── Metadata ──────────────────────────────────────────────────────────────────

fhir.get("/metadata", (c) => {
  return jsonResponse(capabilityStatement());
});

// ── Patient Endpoints ─────────────────────────────────────────────────────────

fhir.get("/Patient", async (c) => {
  const sp = parseSearchParams(c.req.query() as Record<string, string>);
  const conditions: any[] = [];
  const joins: Set<string> = new Set();

  for (const filter of sp.filters) {
    switch (filter.param) {
      case "_id":
      case "_id": {
        conditions.push(eq(schema.patients.id, filter.value));
        break;
      }
      case "identifier": {
        const parts = filter.value.split("|");
        const val = parts[1] || parts[0];
        conditions.push(
          sql`(${schema.patients.uhid} ILIKE ${`%${val}%`} OR ${schema.patients.abhaId} ILIKE ${`%${val}%`})`,
        );
        break;
      }
      case "name": {
        conditions.push(sql`${schema.patients.name} ILIKE ${`%${filter.value}%`}`);
        break;
      }
      case "birthdate": {
        const dateVal = filter.value.replace(/[^0-9-]/g, "");
        if (filter.prefix === "ge" || filter.prefix === "gt" || filter.prefix === "sa") {
          conditions.push(gte(schema.patients.dob, dateVal));
        } else if (filter.prefix === "le" || filter.prefix === "lt" || filter.prefix === "eb") {
          conditions.push(lte(schema.patients.dob, dateVal));
        } else {
          conditions.push(eq(schema.patients.dob, dateVal));
        }
        break;
      }
      case "gender": {
        const genderMap: Record<string, string> = { male: "M", female: "F", other: "O" };
        conditions.push(eq(schema.patients.sex, genderMap[filter.value] || filter.value));
        break;
      }
      case "phone": {
        conditions.push(sql`${schema.patients.phone} ILIKE ${`%${filter.value}%`}`);
        break;
      }
      case "email": {
        conditions.push(sql`${schema.patients.email} ILIKE ${`%${filter.value}%`}`);
        break;
      }
      default: {
        if (filter.param.includes(".")) {
          // Chained param — skip for now, log warning
          break;
        }
      }
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(schema.patients).where(where);
  const total = Number(totalResult[0].count);

  let orderBy = asc(schema.patients.name);
  if (sp.sort) {
    const dir = sp.sort.startsWith("-") ? "desc" : "asc";
    const field = sp.sort.replace(/^-/, "");
    const colMap: Record<string, any> = { name: schema.patients.name, birthdate: schema.patients.dob, _id: schema.patients.id };
    if (colMap[field]) {
      orderBy = dir === "desc" ? desc(colMap[field]) : asc(colMap[field]);
    }
  }

  const rows = await db.select().from(schema.patients)
    .where(where)
    .orderBy(orderBy)
    .limit(sp.count)
    .offset(sp.offset);

  const entries: BundleEntry[] = rows.map((row) => ({
    fullUrl: `${BASE_URL}/Patient/${row.id}`,
    resource: patientToFhir(row),
    search: { mode: "match" as const },
  }));

  const selfLink = `${BASE_URL}/Patient?${new URLSearchParams(c.req.query() as Record<string, string>).toString()}`;
  const bundle = buildBundle("searchset", entries, total, BASE_URL, selfLink);
  return jsonResponse(bundle);
});

fhir.get("/Patient/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await db.select().from(schema.patients).where(eq(schema.patients.id, id)).limit(1);
  if (!rows.length) {
    return jsonResponse(buildOperationOutcome("error", "not-found", `Patient ${id} not found`), 404);
  }
  return jsonResponse(patientToFhir(rows[0]));
});

const createPatientSchema = z.object({
  resourceType: z.literal("Patient"),
  id: z.string().optional(),
  identifier: z.array(z.object({
    system: z.string().optional(),
    value: z.string().optional(),
  })).optional(),
  name: z.array(z.object({
    use: z.string().optional(),
    text: z.string().optional(),
    family: z.string().optional(),
    given: z.array(z.string()).optional(),
  })).optional(),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  telecom: z.array(z.object({
    system: z.string().optional(),
    value: z.string().optional(),
    use: z.string().optional(),
  })).optional(),
  address: z.array(z.object({
    text: z.string().optional(),
    line: z.array(z.string()).optional(),
  })).optional(),
});

fhir.post("/Patient", zValidator("json", createPatientSchema), async (c) => {
  const resource = c.req.valid("json");
  const validation = validateResource("Patient", resource);
  if (validation) {
    return jsonResponse(validation, 400);
  }

  const dbData = fhirPatientToDb(resource);
  await db.insert(schema.patients).values(dbData);
  return jsonResponse(patientToFhir(dbData), 201);
});

const patchPatientSchema = z.object({
  resourceType: z.literal("Patient").optional(),
  id: z.string().optional(),
  name: z.array(z.object({ use: z.string().optional(), text: z.string().optional() })).optional(),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  telecom: z.array(z.object({ system: z.string().optional(), value: z.string().optional() })).optional(),
  address: z.array(z.object({ text: z.string().optional() })).optional(),
}).strict();

fhir.patch("/Patient/:id", zValidator("json", patchPatientSchema), async (c) => {
  const id = c.req.param("id");
  const resource = c.req.valid("json");

  const existing = await db.select().from(schema.patients).where(eq(schema.patients.id, id)).limit(1);
  if (!existing.length) {
    return jsonResponse(buildOperationOutcome("error", "not-found", `Patient ${id} not found`), 404);
  }

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (resource.name) {
    const nameText = resource.name[0]?.text || resource.name[0]?.use || "";
    if (nameText) updates.name = nameText;
  }
  if (resource.gender) {
    const genderMap: Record<string, string> = { male: "M", female: "F", other: "O" };
    updates.sex = genderMap[resource.gender] || "O";
  }
  if (resource.birthDate) updates.dob = resource.birthDate;
  if (resource.telecom) {
    const phone = resource.telecom.find((t: any) => t.system === "phone");
    if (phone?.value) updates.phone = phone.value;
  }
  if (resource.address) {
    updates.address = resource.address[0]?.text || null;
  }

  await db.update(schema.patients).set(updates).where(eq(schema.patients.id, id));

  const updated = await db.select().from(schema.patients).where(eq(schema.patients.id, id)).limit(1);
  return jsonResponse(patientToFhir(updated[0]));
});

// ── Observation Endpoints ─────────────────────────────────────────────────────

fhir.get("/Observation", async (c) => {
  const sp = parseSearchParams(c.req.query() as Record<string, string>);

  const vitalConditions: any[] = [];
  const labConditions: any[] = [];
  const mode = sp.filters.find((f) => f.param === "category")?.value || "all";

  for (const filter of sp.filters) {
    switch (filter.param) {
      case "patient": {
        const pid = filter.value.replace("Patient/", "");
        vitalConditions.push(eq(schema.vitals.patientId, pid));
        labConditions.push(eq(schema.labOrders.patientId, pid));
        break;
      }
      case "_id": {
        vitalConditions.push(eq(schema.vitals.id, filter.value));
        labConditions.push(eq(schema.labOrders.id, filter.value));
        break;
      }
      case "code": {
        labConditions.push(sql`${schema.labOrders.testId} ILIKE ${`%${filter.value}%`}`);
        break;
      }
      case "status": {
        labConditions.push(sql`LOWER(${schema.labOrders.status}) ILIKE ${`%${filter.value}%`}`);
        break;
      }
      case "date": {
        const dateVal = filter.value.replace(/[^0-9T:Z.-]/g, "");
        if (filter.prefix !== "gt" && filter.prefix !== "lt" && filter.prefix !== "ge" && filter.prefix !== "le") {
          vitalConditions.push(sql`${schema.vitals.recordedAt}::date = ${dateVal}::date`);
          labConditions.push(sql`${schema.labOrders.createdAt}::date = ${dateVal}::date`);
        }
        break;
      }
      case "category": {
        break;
      }
    }
  }

  const entries: BundleEntry[] = [];

  const showVitals = mode === "all" || mode === "vital-signs";
  const showLab = mode === "all" || mode === "laboratory";

  if (showVitals) {
    const vitalWhere = vitalConditions.length > 0 ? and(...vitalConditions) : undefined;
    const vitals = await db.select().from(schema.vitals).where(vitalWhere).limit(sp.count).offset(sp.offset);
    for (const v of vitals) {
      for (const obs of observationVitalsToFhir(v)) {
        entries.push({ fullUrl: `${BASE_URL}/Observation/${obs.id}`, resource: obs, search: { mode: "match" as const } });
      }
    }
  }

  if (showLab) {
    const labWhere = labConditions.length > 0 ? and(...labConditions) : undefined;
    const labs = await db.select().from(schema.labOrders).where(labWhere).limit(sp.count).offset(sp.offset);
    for (const lab of labs) {
      let catalog: typeof schema.labTestCatalog.$inferSelect | undefined;
      const catRows = await db.select().from(schema.labTestCatalog).where(eq(schema.labTestCatalog.id, lab.testId)).limit(1);
      if (catRows.length) catalog = catRows[0];
      const obs = labOrderToObservation(lab, catalog);
      entries.push({ fullUrl: `${BASE_URL}/Observation/lab-${lab.id}`, resource: obs, search: { mode: "match" as const } });
    }
  }

  const total = entries.length;
  const selfLink = `${BASE_URL}/Observation?${new URLSearchParams(c.req.query() as Record<string, string>).toString()}`;
  const bundle = buildBundle("searchset", entries, total, BASE_URL, selfLink);
  return jsonResponse(bundle);
});

const createObservationSchema = z.object({
  resourceType: z.literal("Observation"),
  status: z.string(),
  code: z.object({
    coding: z.array(z.object({
      system: z.string().optional(),
      code: z.string(),
      display: z.string().optional(),
    })).optional(),
    text: z.string().optional(),
  }),
  subject: z.object({ reference: z.string() }),
  encounter: z.object({ reference: z.string() }).optional(),
  effectiveDateTime: z.string().optional(),
  valueQuantity: z.object({ value: z.number(), unit: z.string().optional() }).optional(),
  valueString: z.string().optional(),
  component: z.array(z.object({
    code: z.object({ coding: z.array(z.object({ system: z.string().optional(), code: z.string(), display: z.string().optional() })).optional() }),
    valueQuantity: z.object({ value: z.number(), unit: z.string().optional() }).optional(),
  })).optional(),
});

fhir.post("/Observation", zValidator("json", createObservationSchema), async (c) => {
  const resource = c.req.valid("json");
  const validation = validateResource("Observation", resource);
  if (validation) return jsonResponse(validation, 400);

  const pid = resource.subject.reference.replace("Patient/", "");
  const eid = resource.encounter?.reference?.replace("Encounter/", "");

  const id = `obs-${crypto.randomUUID().slice(0, 8)}`;

  // Save as vital if it's a vital sign or has patient + encounter context
  if (resource.valueQuantity || resource.component) {
    const vitalData: any = {
      id,
      patientId: pid,
      encounterId: eid || null,
      recordedAt: resource.effectiveDateTime ? new Date(resource.effectiveDateTime) : new Date(),
    };
    if (resource.valueQuantity) {
      if (resource.code?.coding?.[0]?.code === "8867-4") vitalData.hr = resource.valueQuantity.value;
      else if (resource.code?.coding?.[0]?.code === "9279-1") vitalData.rr = resource.valueQuantity.value;
      else if (resource.code?.coding?.[0]?.code === "8310-5") vitalData.temp = resource.valueQuantity.value.toString();
      else if (resource.code?.coding?.[0]?.code === "2708-6") vitalData.spo2 = resource.valueQuantity.value;
      else if (resource.code?.coding?.[0]?.code === "29463-7") vitalData.weight = resource.valueQuantity.value.toString();
      else if (resource.code?.coding?.[0]?.code === "8302-2") vitalData.height = resource.valueQuantity.value.toString();
    }
    if (resource.component) {
      for (const comp of resource.component) {
        const code = comp.code?.coding?.[0]?.code;
        if (code === "8480-6") vitalData.bpSystolic = comp.valueQuantity?.value;
        if (code === "8462-4") vitalData.bpDiastolic = comp.valueQuantity?.value;
      }
    }
    await db.insert(schema.vitals).values(vitalData);
  }

  return jsonResponse({
    resourceType: "Observation",
    id,
    status: resource.status,
    code: resource.code,
    subject: resource.subject,
    encounter: resource.encounter,
    meta: { lastUpdated: new Date().toISOString() },
  }, 201);
});

// ── Encounter Endpoints ───────────────────────────────────────────────────────

fhir.get("/Encounter", async (c) => {
  const sp = parseSearchParams(c.req.query() as Record<string, string>);
  const conditions: any[] = [];

  for (const filter of sp.filters) {
    switch (filter.param) {
      case "_id": {
        conditions.push(eq(schema.encounters.id, filter.value));
        break;
      }
      case "patient": {
        conditions.push(eq(schema.encounters.patientId, filter.value.replace("Patient/", "")));
        break;
      }
      case "date": {
        const dateVal = filter.value.replace(/[^0-9T:Z.-]/g, "");
        if (filter.prefix === "ge" || filter.prefix === "gt" || filter.prefix === "sa") {
          conditions.push(gte(schema.encounters.datetime, new Date(dateVal)));
        } else if (filter.prefix === "le" || filter.prefix === "lt" || filter.prefix === "eb") {
          conditions.push(lte(schema.encounters.datetime, new Date(dateVal)));
        } else {
          conditions.push(sql`${schema.encounters.datetime}::date = ${dateVal}::date`);
        }
        break;
      }
      case "type": {
        conditions.push(sql`LOWER(${schema.encounters.type}) ILIKE ${`%${filter.value}%`}`);
        break;
      }
      case "status": {
        break;
      }
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(schema.encounters).where(where);
  const total = Number(totalResult[0].count);

  const rows = await db.select().from(schema.encounters)
    .where(where)
    .orderBy(desc(schema.encounters.datetime))
    .limit(sp.count)
    .offset(sp.offset);

  const entries: BundleEntry[] = rows.map((row) => ({
    fullUrl: `${BASE_URL}/Encounter/${row.id}`,
    resource: encounterToFhir(row),
    search: { mode: "match" as const },
  }));

  const selfLink = `${BASE_URL}/Encounter?${new URLSearchParams(c.req.query() as Record<string, string>).toString()}`;
  const bundle = buildBundle("searchset", entries, total, BASE_URL, selfLink);
  return jsonResponse(bundle);
});

fhir.get("/Encounter/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await db.select().from(schema.encounters).where(eq(schema.encounters.id, id)).limit(1);
  if (!rows.length) return jsonResponse(buildOperationOutcome("error", "not-found", `Encounter ${id} not found`), 404);
  return jsonResponse(encounterToFhir(rows[0]));
});

const createEncounterSchema = z.object({
  resourceType: z.literal("Encounter"),
  id: z.string().optional(),
  status: z.string(),
  class: z.object({ code: z.string() }).optional(),
  type: z.array(z.object({ coding: z.array(z.object({ code: z.string() })).optional() })).optional(),
  subject: z.object({ reference: z.string() }),
  period: z.object({ start: z.string() }).optional(),
  reasonCode: z.array(z.object({ text: z.string() })).optional(),
});

fhir.post("/Encounter", zValidator("json", createEncounterSchema), async (c) => {
  const resource = c.req.valid("json");
  const validation = validateResource("Encounter", resource);
  if (validation) return jsonResponse(validation, 400);

  const pid = resource.subject.reference.replace("Patient/", "");
  const typeCode = resource.type?.[0]?.coding?.[0]?.code || "OPD";
  const typeMap: Record<string, string> = { VR: "Telemedicine", EMER: "Emergency", IMP: "IPD", AMB: "OPD" };
  const encType = typeMap[typeCode] || typeCode;

  const id = resource.id || `ENC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  await db.insert(schema.encounters).values({
    id,
    patientId: pid,
    department: "General",
    type: encType as any,
    datetime: resource.period?.start ? new Date(resource.period.start) : new Date(),
    chiefComplaint: resource.reasonCode?.[0]?.text || null,
  });

  return jsonResponse({
    resourceType: "Encounter",
    id,
    status: resource.status,
    subject: resource.subject,
    meta: { lastUpdated: new Date().toISOString() },
  }, 201);
});

// ── Condition Endpoints ───────────────────────────────────────────────────────

fhir.get("/Condition", async (c) => {
  const sp = parseSearchParams(c.req.query() as Record<string, string>);
  const conditions: any[] = [];

  for (const filter of sp.filters) {
    switch (filter.param) {
      case "_id": {
        conditions.push(eq(schema.diagnoses.id, filter.value));
        break;
      }
      case "patient": {
        // Need to join encounters to get patient
        const pid = filter.value.replace("Patient/", "");
        const encRows = await db.select({ id: schema.encounters.id }).from(schema.encounters)
          .where(eq(schema.encounters.patientId, pid));
        if (encRows.length) {
          conditions.push(inArray(schema.diagnoses.encounterId, encRows.map((e) => e.id)));
        } else {
          conditions.push(eq(sql`1`, sql`0`)); // no matches
        }
        break;
      }
      case "code": {
        conditions.push(sql`${schema.diagnoses.icdCode} ILIKE ${`%${filter.value}%`}`);
        break;
      }
      case "clinical-status": {
        if (filter.value === "active") {
          conditions.push(eq(schema.diagnoses.certainty, "Confirmed"));
        }
        break;
      }
      case "encounter": {
        conditions.push(eq(schema.diagnoses.encounterId, filter.value.replace("Encounter/", "")));
        break;
      }
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(schema.diagnoses).where(where);
  const total = Number(totalResult[0].count);

  const rows = await db.select().from(schema.diagnoses).where(where).limit(sp.count).offset(sp.offset);

  // Get patient IDs for each diagnosis
  const encIds = [...new Set(rows.map((r) => r.encounterId))];
  let encMap = new Map<string, string>();
  if (encIds.length) {
    const encs = await db.select({ id: schema.encounters.id, patientId: schema.encounters.patientId })
      .from(schema.encounters).where(inArray(schema.encounters.id, encIds));
    encMap = new Map(encs.map((e) => [e.id, e.patientId]));
  }

  const entries: BundleEntry[] = rows.map((row) => {
    const cond = diagnosisToCondition(row);
    const patientId = encMap.get(row.encounterId);
    cond.subject = { reference: `Patient/${patientId || "unknown"}` };
    return {
      fullUrl: `${BASE_URL}/Condition/${row.id}`,
      resource: cond,
      search: { mode: "match" as const },
    };
  });

  const selfLink = `${BASE_URL}/Condition?${new URLSearchParams(c.req.query() as Record<string, string>).toString()}`;
  return jsonResponse(buildBundle("searchset", entries, total, BASE_URL, selfLink));
});

fhir.get("/Condition/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await db.select().from(schema.diagnoses).where(eq(schema.diagnoses.id, id)).limit(1);
  if (!rows.length) return jsonResponse(buildOperationOutcome("error", "not-found", `Condition ${id} not found`), 404);

  const cond = diagnosisToCondition(rows[0]);
  const encs = await db.select({ patientId: schema.encounters.patientId })
    .from(schema.encounters).where(eq(schema.encounters.id, rows[0].encounterId)).limit(1);
  cond.subject = { reference: `Patient/${encs[0]?.patientId || "unknown"}` };
  return jsonResponse(cond);
});

// ── MedicationRequest Endpoints ───────────────────────────────────────────────

fhir.get("/MedicationRequest", async (c) => {
  const sp = parseSearchParams(c.req.query() as Record<string, string>);
  const conditions: any[] = [];

  for (const filter of sp.filters) {
    switch (filter.param) {
      case "_id": {
        conditions.push(eq(schema.prescriptions.id, filter.value));
        break;
      }
      case "patient": {
        conditions.push(eq(schema.prescriptions.patientId, filter.value.replace("Patient/", "")));
        break;
      }
      case "status": {
        conditions.push(sql`LOWER(${schema.prescriptions.status}) ILIKE ${`%${filter.value}%`}`);
        break;
      }
      case "authored-on": {
        const dateVal = filter.value.replace(/[^0-9T:Z.-]/g, "");
        conditions.push(sql`${schema.prescriptions.createdAt}::date = ${dateVal}::date`);
        break;
      }
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(schema.prescriptions).where(where);
  const total = Number(totalResult[0].count);

  const rxRows = await db.select().from(schema.prescriptions).where(where)
    .orderBy(desc(schema.prescriptions.createdAt))
    .limit(sp.count).offset(sp.offset);

  const entries: BundleEntry[] = [];
  for (const rx of rxRows) {
    const items = await db.select().from(schema.rxItems).where(eq(schema.rxItems.prescriptionId, rx.id));
    entries.push({
      fullUrl: `${BASE_URL}/MedicationRequest/${rx.id}`,
      resource: prescriptionToMedicationRequest(rx, items),
      search: { mode: "match" as const },
    });
  }

  const selfLink = `${BASE_URL}/MedicationRequest?${new URLSearchParams(c.req.query() as Record<string, string>).toString()}`;
  return jsonResponse(buildBundle("searchset", entries, total, BASE_URL, selfLink));
});

fhir.get("/MedicationRequest/:id", async (c) => {
  const id = c.req.param("id");
  const rxRows = await db.select().from(schema.prescriptions).where(eq(schema.prescriptions.id, id)).limit(1);
  if (!rxRows.length) return jsonResponse(buildOperationOutcome("error", "not-found", `MedicationRequest ${id} not found`), 404);

  const items = await db.select().from(schema.rxItems).where(eq(schema.rxItems.prescriptionId, id));
  return jsonResponse(prescriptionToMedicationRequest(rxRows[0], items));
});

// ── DiagnosticReport Endpoints ───────────────────────────────────────────────

fhir.get("/DiagnosticReport", async (c) => {
  const sp = parseSearchParams(c.req.query() as Record<string, string>);
  const labConditions: any[] = [];
  const imgConditions: any[] = [];

  for (const filter of sp.filters) {
    switch (filter.param) {
      case "_id": {
        labConditions.push(eq(schema.labOrders.id, filter.value));
        imgConditions.push(eq(schema.imagingStudies.id, filter.value));
        break;
      }
      case "patient": {
        const pid = filter.value.replace("Patient/", "");
        labConditions.push(eq(schema.labOrders.patientId, pid));
        imgConditions.push(eq(schema.imagingStudies.patientId, pid));
        break;
      }
      case "date": {
        const dateVal = filter.value.replace(/[^0-9T:Z.-]/g, "");
        labConditions.push(sql`${schema.labOrders.createdAt}::date = ${dateVal}::date`);
        imgConditions.push(sql`${schema.imagingStudies.createdAt}::date = ${dateVal}::date`);
        break;
      }
      case "status": {
        labConditions.push(sql`LOWER(${schema.labOrders.status}) ILIKE ${`%${filter.value}%`}`);
        break;
      }
    }
  }

  const entries: BundleEntry[] = [];

  const labWhere = labConditions.length > 0 ? and(...labConditions) : undefined;
  const labs = await db.select().from(schema.labOrders).where(labWhere)
    .orderBy(desc(schema.labOrders.createdAt))
    .limit(sp.count).offset(sp.offset);

  const groupedByEncounter = new Map<string, typeof labs>();
  for (const lab of labs) {
    const key = lab.encounterId || lab.patientId;
    if (!groupedByEncounter.has(key)) groupedByEncounter.set(key, []);
    groupedByEncounter.get(key)!.push(lab);
  }

  for (const [key, group] of groupedByEncounter) {
    const reportId = `dr-lab-${key}-${crypto.randomUUID().slice(0, 4)}`;
    const resultRefs = group.map((lab) => ({ reference: `Observation/lab-${lab.id}` }));
    const patientId = group[0].patientId;
    entries.push({
      fullUrl: `${BASE_URL}/DiagnosticReport/${reportId}`,
      resource: {
        resourceType: "DiagnosticReport",
        id: reportId,
        status: group.some((l) => l.status === "Verified") ? "final" : "preliminary",
        code: { coding: [{ system: "http://aarogyaehr.in/report-type", code: "LAB", display: "Laboratory Report" }], text: "Laboratory Report" },
        subject: { reference: `Patient/${patientId}` },
        encounter: group[0].encounterId ? { reference: `Encounter/${group[0].encounterId}` } : undefined,
        effectiveDateTime: group[0].collectedAt?.toISOString(),
        issued: group[0].resultedAt?.toISOString(),
        result: resultRefs,
        meta: { lastUpdated: new Date().toISOString() },
      },
      search: { mode: "match" as const },
    });
  }

  const total = entries.length;
  const selfLink = `${BASE_URL}/DiagnosticReport?${new URLSearchParams(c.req.query() as Record<string, string>).toString()}`;
  return jsonResponse(buildBundle("searchset", entries, total, BASE_URL, selfLink));
});

fhir.get("/DiagnosticReport/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await db.select().from(schema.labOrders).where(eq(schema.labOrders.id, id)).limit(1);
  if (!rows.length) {
    // Try imaging
    const imgRows = await db.select().from(schema.imagingStudies).where(eq(schema.imagingStudies.id, id)).limit(1);
    if (!imgRows.length) {
      return jsonResponse(buildOperationOutcome("error", "not-found", `DiagnosticReport ${id} not found`), 404);
    }
    const img = imgRows[0];
    return jsonResponse({
      resourceType: "DiagnosticReport",
      id: img.id,
      status: "final",
      code: { coding: [{ system: "http://aarogyaehr.in/report-type", code: "IMG", display: "Imaging Report" }], text: img.description || "Imaging Report" },
      subject: { reference: `Patient/${img.patientId}` },
      encounter: img.encounterId ? { reference: `Encounter/${img.encounterId}` } : undefined,
      presentedForm: img.report ? [{ url: img.report }] : undefined,
      meta: { lastUpdated: img.createdAt?.toISOString() },
    });
  }

  const lab = rows[0];
  return jsonResponse({
    resourceType: "DiagnosticReport",
    id: lab.id,
    status: lab.status === "Verified" ? "final" : "preliminary",
    code: { coding: [{ system: "http://aarogyaehr.in/report-type", code: "LAB", display: "Laboratory Report" }], text: "Laboratory Report" },
    subject: { reference: `Patient/${lab.patientId}` },
    encounter: lab.encounterId ? { reference: `Encounter/${lab.encounterId}` } : undefined,
    result: [{ reference: `Observation/lab-${lab.id}` }],
    meta: { lastUpdated: lab.createdAt?.toISOString() },
  });
});

const createDiagnosticReportSchema = z.object({
  resourceType: z.literal("DiagnosticReport"),
  status: z.string(),
  code: z.object({ coding: z.array(z.object({ code: z.string() })).optional(), text: z.string().optional() }),
  subject: z.object({ reference: z.string() }),
  encounter: z.object({ reference: z.string() }).optional(),
  result: z.array(z.object({ reference: z.string() })).optional(),
  presentedForm: z.array(z.object({ url: z.string() })).optional(),
});

fhir.post("/DiagnosticReport", zValidator("json", createDiagnosticReportSchema), async (c) => {
  const resource = c.req.valid("json");
  const validation = validateResource("DiagnosticReport", resource);
  if (validation) return jsonResponse(validation, 400);

  const pid = resource.subject.reference.replace("Patient/", "");
  const id = `dr-${crypto.randomUUID().slice(0, 8)}`;

  if (resource.presentedForm) {
    // Imaging-style report
    const eid = resource.encounter?.reference?.replace("Encounter/", "");
    await db.insert(schema.imagingStudies).values({
      id,
      patientId: pid,
      encounterId: eid || null,
      description: resource.code?.text || "Imaging Report",
      report: resource.presentedForm[0]?.url,
      status: resource.status === "final" ? "completed" : "available",
    });
  }

  return jsonResponse({
    resourceType: "DiagnosticReport",
    id,
    status: resource.status,
    code: resource.code,
    subject: resource.subject,
    meta: { lastUpdated: new Date().toISOString() },
  }, 201);
});

// ── ImagingStudy Endpoints ────────────────────────────────────────────────────

fhir.get("/ImagingStudy", async (c) => {
  const sp = parseSearchParams(c.req.query() as Record<string, string>);
  const conditions: any[] = [];

  for (const filter of sp.filters) {
    switch (filter.param) {
      case "_id": {
        conditions.push(eq(schema.imagingStudies.id, filter.value));
        break;
      }
      case "patient": {
        conditions.push(eq(schema.imagingStudies.patientId, filter.value.replace("Patient/", "")));
        break;
      }
      case "modality": {
        conditions.push(sql`LOWER(${schema.imagingStudies.modality}) ILIKE ${`%${filter.value}%`}`);
        break;
      }
      case "date": {
        const dateVal = filter.value.replace(/[^0-9T:Z.-]/g, "");
        conditions.push(sql`${schema.imagingStudies.createdAt}::date = ${dateVal}::date`);
        break;
      }
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(schema.imagingStudies).where(where);
  const total = Number(totalResult[0].count);

  const rows = await db.select().from(schema.imagingStudies).where(where)
    .orderBy(desc(schema.imagingStudies.createdAt))
    .limit(sp.count).offset(sp.offset);

  const entries: BundleEntry[] = rows.map((row) => ({
    fullUrl: `${BASE_URL}/ImagingStudy/${row.id}`,
    resource: imagingStudyToFhir(row),
    search: { mode: "match" as const },
  }));

  const selfLink = `${BASE_URL}/ImagingStudy?${new URLSearchParams(c.req.query() as Record<string, string>).toString()}`;
  return jsonResponse(buildBundle("searchset", entries, total, BASE_URL, selfLink));
});

fhir.get("/ImagingStudy/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await db.select().from(schema.imagingStudies).where(eq(schema.imagingStudies.id, id)).limit(1);
  if (!rows.length) return jsonResponse(buildOperationOutcome("error", "not-found", `ImagingStudy ${id} not found`), 404);
  return jsonResponse(imagingStudyToFhir(rows[0]));
});

// ── Subscription Endpoints ────────────────────────────────────────────────────

const createSubscriptionSchema = z.object({
  resourceType: z.literal("Subscription"),
  status: z.enum(["requested", "active", "error", "off"]),
  reason: z.string().min(1),
  criteria: z.string().min(1),
  channel: z.object({
    type: z.enum(["rest-hook", "websocket", "email", "sms"]),
    endpoint: z.string().url(),
    payload: z.string().optional(),
    header: z.array(z.string()).optional(),
  }),
});

fhir.post("/Subscription", zValidator("json", createSubscriptionSchema), async (c) => {
  const resource = c.req.valid("json");
  const validation = validateResource("Subscription", resource);
  if (validation) return jsonResponse(validation, 400);

  const id = resource.id || `Subscription-${crypto.randomUUID().slice(0, 8)}`;
  const sub = {
    ...resource,
    id,
    status: "requested" as const,
    meta: { lastUpdated: new Date().toISOString() },
  };
  SUBSCRIPTIONS.set(id, sub);

  // Auto-activate for rest-hook
  if (sub.channel.type === "rest-hook") {
    sub.status = "active";
    SUBSCRIPTIONS.set(id, sub);
  }

  return jsonResponse(sub, 201);
});

fhir.get("/Subscription", async (c) => {
  const subs = Array.from(SUBSCRIPTIONS.values());
  const entries: BundleEntry[] = subs.map((sub) => ({
    fullUrl: `${BASE_URL}/Subscription/${sub.id}`,
    resource: sub,
    search: { mode: "match" as const },
  }));
  return jsonResponse(buildBundle("searchset", entries, subs.length, BASE_URL));
});

fhir.get("/Subscription/:id", async (c) => {
  const id = c.req.param("id");
  const sub = SUBSCRIPTIONS.get(id);
  if (!sub) return jsonResponse(buildOperationOutcome("error", "not-found", `Subscription ${id} not found`), 404);
  return jsonResponse(sub);
});

// ── Batch / Transaction ───────────────────────────────────────────────────────

fhir.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || body.resourceType !== "Bundle") {
    return jsonResponse(buildOperationOutcome("error", "invalid", "Expected a Bundle resource"), 400);
  }

  const bundleType = body.type;
  if (bundleType !== "batch" && bundleType !== "transaction") {
    return jsonResponse(buildOperationOutcome("error", "invalid", `Unsupported bundle type: ${bundleType}. Must be 'batch' or 'transaction'`), 400);
  }

  const entryResponses: BundleEntry[] = [];
  for (const entry of (body.entry || []) as any[]) {
    if (!entry.request) {
      entryResponses.push({
        response: { status: "400", location: undefined },
      });
      continue;
    }

    const { method, url } = entry.request;
    const [resourceType, resourceId] = url.split("/");
    const resource = entry.resource;

    try {
      if (method === "POST" && !resourceId) {
        // Create
        if (resourceType === "Patient") {
          const validation = validateResource("Patient", resource);
          if (validation) {
            entryResponses.push({ response: { status: "400" } });
            continue;
          }
          const dbData = fhirPatientToDb(resource);
          await db.insert(schema.patients).values(dbData);
          entryResponses.push({
            response: { status: "201", location: `${BASE_URL}/Patient/${dbData.id}` },
          });
        } else {
          entryResponses.push({ response: { status: "501" } });
        }
      } else if (method === "PUT" && resourceId) {
        entryResponses.push({ response: { status: "501" } });
      } else {
        entryResponses.push({ response: { status: "400" } });
      }
    } catch (err: any) {
      entryResponses.push({
        response: { status: "500" },
      });
    }
  }

  const bundle: FHIRBundle = {
    resourceType: "Bundle",
    type: `${bundleType}-response`,
    id: crypto.randomUUID(),
    meta: { lastUpdated: new Date().toISOString() },
    timestamp: new Date().toISOString(),
    entry: entryResponses,
  };

  return jsonResponse(bundle);
});

// ── Catch-all: unknown resource types return OperationOutcome ────────────────

fhir.get("/:resourceType", (c) => {
  const rt = c.req.param("resourceType");
  if (rt === "metadata") return; // already handled above
  return jsonResponse(
    buildOperationOutcome("error", "not-supported", `Resource type "${rt}" is not supported by this server`, ["resourceType"]),
    404,
  );
});

fhir.get("/:resourceType/:id", (c) => {
  const rt = c.req.param("resourceType");
  return jsonResponse(
    buildOperationOutcome("error", "not-supported", `Resource type "${rt}" is not supported by this server`, ["resourceType"]),
    404,
  );
});

export default fhir;
