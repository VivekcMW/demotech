// HIPAA Access Audit Log middleware
// §164.312(b) — Audit Controls: Record and examine activity in systems containing PHI
//
// This log records every access to PHI resources with:
//   - WHO accessed it (userId, role)
//   - WHAT was accessed (resource, record ID)
//   - WHEN (timestamp)
//   - FROM WHERE (IP address, request ID)
//   - ACTION taken (read/write/delete)
//   - OUTCOME (success/failure)

import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { db, schema } from "../db";

export type AuditAction = "READ" | "CREATE" | "UPDATE" | "DELETE" | "SEARCH" | "LOGIN" | "LOGOUT" | "LOGIN_FAILED";

// PHI-bearing resources that require audit logging
const PHI_RESOURCES = new Set([
  "patients", "encounters", "diagnoses", "vitals", "prescriptions",
  "lab", "billing", "claims", "clinical", "orders",
]);

function getResourceFromPath(path: string): string | null {
  const segments = path.replace("/api/v1/", "").split("/");
  const resource = segments[0];
  return PHI_RESOURCES.has(resource) ? resource : null;
}

function getRecordIdFromPath(path: string): string | null {
  const segments = path.replace("/api/v1/", "").split("/");
  // e.g. /patients/PT-001 → segments[1] = "PT-001"
  return segments.length > 1 && segments[1] ? segments[1] : null;
}

function methodToAction(method: string): AuditAction {
  switch (method.toUpperCase()) {
    case "GET": return "READ";
    case "POST": return "CREATE";
    case "PATCH":
    case "PUT": return "UPDATE";
    case "DELETE": return "DELETE";
    default: return "READ";
  }
}

// Sanitize path for logging - remove any query string values that may contain PHI
// Keep only the path structure and parameter names
function sanitizePath(path: string): string {
  return path.split("?")[0]; // Strip query string entirely from logged path
}

// ── Audit log middleware ──────────────────────────────────────────────────────
// Attach this to all PHI-bearing routes AFTER authMiddleware
export const auditLog = createMiddleware(async (c: Context, next) => {
  const path = c.req.path;
  const resource = getResourceFromPath(path);

  // Only log PHI resource access
  if (!resource) {
    await next();
    return;
  }

  const payload = c.get("jwtPayload") as { sub?: string; email?: string; role?: string } | undefined;
  const userId = payload?.sub || "anonymous";
  const userRole = payload?.role || "unknown";
  const action = methodToAction(c.req.method);
  const recordId = getRecordIdFromPath(path);
  const requestId = c.get("requestId") as string || "unknown";
  const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
              c.req.header("x-real-ip") ||
              "unknown";
  const startTime = Date.now();

  let outcome: "SUCCESS" | "FAILURE" = "SUCCESS";

  try {
    await next();
    const status = c.res.status;
    if (status >= 400) outcome = "FAILURE";
  } catch (err) {
    outcome = "FAILURE";
    throw err;
  } finally {
    const durationMs = Date.now() - startTime;

    // Write audit log asynchronously - never block the response
    db.insert(schema.auditLogs).values({
      userId,
      userRole,
      action,
      resource,
      recordId: recordId || null,
      outcome,
      requestId,
      ipAddress: ip,
      path: sanitizePath(path),
      durationMs,
    }).catch((e: Error) => {
      // Audit log failure must be recorded but must not break the request
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "AUDIT_LOG_FAILURE",
        error: e.message,
        requestId,
      }));
    });
  }
});

// ── Manual audit log writer (for auth events) ─────────────────────────────────
export async function writeAuditLog(params: {
  userId: string;
  userRole: string;
  action: AuditAction;
  resource: string;
  recordId?: string;
  outcome: "SUCCESS" | "FAILURE";
  requestId?: string;
  ipAddress?: string;
  path?: string;
  details?: string;
}) {
  try {
    await db.insert(schema.auditLogs).values({
      userId: params.userId,
      userRole: params.userRole,
      action: params.action,
      resource: params.resource,
      recordId: params.recordId || null,
      outcome: params.outcome,
      requestId: params.requestId || null,
      ipAddress: params.ipAddress || "unknown",
      path: params.path || null,
      details: params.details || null,
      durationMs: 0,
    });
  } catch (e) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      message: "AUDIT_LOG_WRITE_FAILURE",
      error: (e as Error).message,
    }));
  }
}
