import { Hono } from "hono";

interface ExportJob {
  requestId: string;
  status: "running" | "completed" | "error";
  progress: number;
  types: string[];
  since?: string;
  outputFiles: Record<string, string>;
  error?: string;
}

const exportJobs = new Map<string, ExportJob>();

function generateId(): string {
  return `export-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateNdjson(resources: object[]): string {
  return resources.map((r) => JSON.stringify(r)).join("\n");
}

const MOCK_PATIENTS = [
  { resourceType: "Patient", id: "PAT-0001", name: [{ family: "Kumar", given: ["Rajesh"] }], gender: "male", birthDate: "1980-05-12" },
  { resourceType: "Patient", id: "PAT-0002", name: [{ family: "Sharma", given: ["Priya"] }], gender: "female", birthDate: "1992-11-03" },
  { resourceType: "Patient", id: "PAT-0003", name: [{ family: "Verma", given: ["Anil"] }], gender: "male", birthDate: "1975-08-21" },
];

const MOCK_OBSERVATIONS = [
  { resourceType: "Observation", id: "OBS-001", subject: { reference: "Patient/PAT-0001" }, code: { coding: [{ code: "8867-4", display: "Heart rate" }] }, valueQuantity: { value: 72, unit: "/min" } },
  { resourceType: "Observation", id: "OBS-002", subject: { reference: "Patient/PAT-0002" }, code: { coding: [{ code: "8480-6", display: "Systolic BP" }] }, valueQuantity: { value: 118, unit: "mmHg" } },
];

export async function processExportJob(requestId: string, types: string[], since?: string): Promise<void> {
  const job = exportJobs.get(requestId);
  if (!job) return;

  try {
    const outputFiles: Record<string, string> = {};
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      job.progress = Math.round(((i) / types.length) * 100);

      let resources: object[] = [];
      if (type === "Patient") {
        resources = since ? MOCK_PATIENTS.filter((p) => p.birthDate >= since) : MOCK_PATIENTS;
      } else if (type === "Observation") {
        resources = [...MOCK_OBSERVATIONS];
      }

      if (resources.length > 0) {
        outputFiles[type] = generateNdjson(resources);
      }
    }
    job.outputFiles = outputFiles;
    job.status = "completed";
    job.progress = 100;
  } catch (err) {
    job.status = "error";
    job.error = (err as Error).message;
  }
}

const bulkExport = new Hono();

bulkExport.get("/$export", async (c) => {
  const _type = c.req.query("_type");
  const _since = c.req.query("_since");
  const types = _type ? _type.split(",") : ["Patient", "Observation", "Encounter", "Condition"];
  const requestId = generateId();

  const job: ExportJob = {
    requestId,
    status: "running",
    progress: 0,
    types,
    since: _since,
    outputFiles: {},
  };
  exportJobs.set(requestId, job);

  processExportJob(requestId, types, _since);

  c.status(202);
  c.header("Content-Location", `/api/fhir/r4/_export/${requestId}/status`);
  return c.json({
    transactionTime: new Date().toISOString(),
    request: `/api/fhir/r4/$export?_type=${types.join(",")}`,
    requiresAccessToken: true,
    output: [],
    error: [],
  });
});

bulkExport.get("/Patient/:id/$export", async (c) => {
  const _type = c.req.query("_type");
  const _since = c.req.query("_since");
  const types = _type ? _type.split(",") : ["Patient", "Observation", "Encounter"];
  const requestId = generateId();

  const job: ExportJob = {
    requestId,
    status: "running",
    progress: 0,
    types,
    since: _since,
    outputFiles: {},
  };
  exportJobs.set(requestId, job);

  processExportJob(requestId, types, _since);

  c.status(202);
  c.header("Content-Location", `/api/fhir/r4/_export/${requestId}/status`);
  return c.json({
    transactionTime: new Date().toISOString(),
    request: `/api/fhir/r4/Patient/${c.req.param("id")}/$export`,
    requiresAccessToken: true,
    output: [],
    error: [],
  });
});

bulkExport.get("/_export/:requestId/status", async (c) => {
  const job = exportJobs.get(c.req.param("requestId"));
  if (!job) return c.json({ error: "Export job not found" }, 404);

  if (job.status === "completed") {
    const output = job.types
      .filter((t) => job.outputFiles[t])
      .map((t) => ({
        type: t,
        url: `/api/fhir/r4/_export/${job.requestId}/${t}`,
        count: job.outputFiles[t].split("\n").filter(Boolean).length,
      }));

    return c.json({
      transactionTime: new Date().toISOString(),
      request: `/api/fhir/r4/_export/${job.requestId}/status`,
      requiresAccessToken: true,
      output,
      error: [],
    });
  }

  if (job.status === "error") {
    return c.json({
      transactionTime: new Date().toISOString(),
      request: `/api/fhir/r4/_export/${job.requestId}/status`,
      requiresAccessToken: true,
      output: [],
      error: [{ type: "OperationOutcome", url: "" }],
    });
  }

  c.status(202);
  return c.json({
    transactionTime: new Date().toISOString(),
    progress: job.progress,
    status: "running",
  });
});

bulkExport.get("/_export/:requestId/:resourceType", async (c) => {
  const job = exportJobs.get(c.req.param("requestId"));
  if (!job) return c.json({ error: "Export job not found" }, 404);

  const ndjson = job.outputFiles[c.req.param("resourceType")];
  if (!ndjson) return c.json({ error: "Resource type not found in export" }, 404);

  c.header("Content-Type", "application/fhir+ndjson");
  return c.body(ndjson);
});

export default bulkExport;
