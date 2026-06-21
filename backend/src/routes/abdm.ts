import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  generateAbhaViaAadhaar,
  verifyAadhaarOtp,
  generateAbhaViaMobile,
  verifyMobileOtp,
  verifyAbha,
  searchAbha,
} from "../abdm/healthId";
import {
  requestConsent,
  getConsentStatus,
  notifyConsentAction,
  revokeConsent,
} from "../abdm/consent";
import { pushHealthRecords, pullHealthRecords, getDataFlowStatus, notifyDataFlow, getHieNotifications } from "../abdm/dataFlow";
import type { FhirResource } from "../fhir/engine";
import { syncToPHR, syncFromPHR, getSyncStatus, scheduleSync, getSyncStats } from "../abdm/phr";
import { getAllConsents, getConsentArtefact } from "../abdm/consent";
import { checkGatewayHealth, resetSession } from "../abdm/gateway";
import { getAbdmConfig } from "../abdm/config";

const abdm = new Hono();

// ── Gateway Management ──────────────────────────────────────────────────

abdm.get("/gateway/health", async (c) => {
  const health = await checkGatewayHealth();
  return c.json(health);
});

abdm.get("/gateway/config", async (c) => {
  const config = getAbdmConfig();
  return c.json({
    mode: config.mode,
    clientId: config.clientId,
    hipId: config.hipId,
    hipName: config.hipName,
    callbackBaseUrl: config.callbackBaseUrl,
    gatewayUrl: config.mode === "sandbox"
      ? "https://sandbox.abdm.gov.in"
      : "https://abdm.gov.in",
  });
});

abdm.post("/gateway/reset-session", async (c) => {
  resetSession();
  return c.json({ message: "Session reset" });
});

// ── Health ID ─────────────────────────────────────────────────────────────

const createAbhaSchema = z.object({
  aadhaar: z.string().length(12).optional(),
  mobile: z.string().length(10).optional(),
  txnId: z.string().optional(),
  otp: z.string().length(6).optional(),
  method: z.enum(["aadhaar", "mobile"]),
});

abdm.post("/health-id/create", zValidator("json", createAbhaSchema), async (c) => {
  const { method, aadhaar, mobile, txnId, otp } = c.req.valid("json");

  if (method === "aadhaar") {
    if (txnId && otp) {
      const result = await verifyAadhaarOtp(txnId, otp);
      return c.json(result, result.success ? 200 : 400);
    }
    if (!aadhaar) return c.json({ error: "Aadhaar number required" }, 400);
    const txn = `txn-${Date.now()}`;
    const result = await generateAbhaViaAadhaar(aadhaar, txn);
    return c.json(result);
  }

  if (method === "mobile") {
    if (txnId && otp) {
      const result = await verifyMobileOtp(txnId, otp);
      return c.json(result, result.success ? 200 : 400);
    }
    if (!mobile) return c.json({ error: "Mobile number required" }, 400);
    const result = await generateAbhaViaMobile(mobile);
    return c.json(result);
  }

  return c.json({ error: "Invalid method" }, 400);
});

const verifyAbhaSchema = z.object({
  abhaId: z.string().min(1),
});

abdm.post("/health-id/verify", zValidator("json", verifyAbhaSchema), async (c) => {
  const { abhaId } = c.req.valid("json");
  const result = await verifyAbha(abhaId);
  return c.json(result);
});

const searchAbhaSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(["M", "F", "O"]),
  dob: z.string(),
  mobile: z.string().length(10),
});

abdm.post("/health-id/search", zValidator("json", searchAbhaSchema), async (c) => {
  const data = c.req.valid("json");
  const result = await searchAbha(data.name, data.gender, data.dob, data.mobile);
  return c.json(result);
});

// ── Consent ───────────────────────────────────────────────────────────────

abdm.get("/consent", async (c) => {
  const patientAbha = c.req.query("patientAbha");
  const status = c.req.query("status");
  const result = await getAllConsents({ patientAbha, status });
  return c.json(result);
});

abdm.get("/consent/:id/artefact", async (c) => {
  const id = c.req.param("id");
  const result = await getConsentArtefact(id);
  if (!result) return c.json({ error: "Consent not found" }, 404);
  return c.json(result);
});

const requestConsentSchema = z.object({
  patientAbha: z.string().min(1),
  hipId: z.string().min(1),
  purpose: z.string().min(1),
  fromDate: z.string(),
  toDate: z.string(),
});

abdm.post("/consent/request", zValidator("json", requestConsentSchema), async (c) => {
  const data = c.req.valid("json");
  const result = await requestConsent(data.patientAbha, data.hipId, data.purpose, data.fromDate, data.toDate);
  return c.json(result, 201);
});

abdm.get("/consent/:id/status", async (c) => {
  const id = c.req.param("id");
  const result = await getConsentStatus(id);
  if (!result) return c.json({ error: "Consent request not found" }, 404);
  return c.json(result);
});

abdm.post("/consent/notify", async (c) => {
  const notification = await c.req.json();
  const result = await notifyConsentAction(notification);
  return c.json(result);
});

abdm.post("/consent/:id/revoke", async (c) => {
  const id = c.req.param("id");
  const result = await revokeConsent(id);
  return c.json(result);
});

// ── HIE Data Flow ─────────────────────────────────────────────────────────

const dataPushSchema = z.object({
  consentId: z.string().min(1),
  resources: z.array(z.record(z.unknown())),
});

abdm.post("/hie/data-push", zValidator("json", dataPushSchema), async (c) => {
  const { consentId, resources } = c.req.valid("json");
  const result = await pushHealthRecords(consentId, resources as FhirResource[]);
  return c.json(result, 201);
});

const dataPullSchema = z.object({
  consentId: z.string().min(1),
  hiTypes: z.array(z.string()),
});

abdm.post("/hie/data-pull", zValidator("json", dataPullSchema), async (c) => {
  const { consentId, hiTypes } = c.req.valid("json");
  const result = await pullHealthRecords(consentId, hiTypes);
  return c.json(result);
});

abdm.get("/hie/data-flow/:id/status", async (c) => {
  const id = c.req.param("id");
  const result = await getDataFlowStatus(id);
  if (!result) return c.json({ error: "Transaction not found" }, 404);
  return c.json(result);
});

abdm.post("/hie/notify", async (c) => {
  const notification = await c.req.json();
  const result = await notifyDataFlow(notification);
  return c.json(result);
});

// ── PHR Sync ──────────────────────────────────────────────────────────────

const phrSyncSchema = z.object({
  patientId: z.string().min(1),
  resourceTypes: z.array(z.string()).optional(),
  abhaId: z.string().optional(),
  direction: z.enum(["to-phr", "from-phr"]),
});

abdm.post("/phr/sync", zValidator("json", phrSyncSchema), async (c) => {
  const { patientId, resourceTypes, abhaId, direction } = c.req.valid("json");

  if (direction === "to-phr") {
    const result = await syncToPHR(patientId, resourceTypes || []);
    return c.json(result, 201);
  }

  if (direction === "from-phr") {
    if (!abhaId) return c.json({ error: "abhaId required for from-phr sync" }, 400);
    const result = await syncFromPHR(patientId, abhaId);
    return c.json(result, 201);
  }

  return c.json({ error: "Invalid direction" }, 400);
});

const scheduleSyncSchema = z.object({
  patientId: z.string().min(1),
  interval: z.string().min(1),
});

abdm.post("/phr/schedule", zValidator("json", scheduleSyncSchema), async (c) => {
  const { patientId, interval } = c.req.valid("json");
  const result = await scheduleSync(patientId, interval);
  return c.json(result);
});

abdm.get("/phr/status/:patientId", async (c) => {
  const patientId = c.req.param("patientId");
  const result = await getSyncStatus(patientId);
  return c.json(result);
});

abdm.get("/phr/stats", async (c) => {
  const stats = await getSyncStats();
  return c.json(stats);
});

abdm.get("/hie/notifications", async (c) => {
  const notifications = await getHieNotifications();
  return c.json(notifications);
});

export default abdm;
