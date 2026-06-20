// HIPAA-compliant Role-Based Access Control (RBAC) middleware
// §164.312(a)(1) — Access Control: Unique user identification + role-based permissions

import { createMiddleware } from "hono/factory";
import type { Context } from "hono";

// ── Role hierarchy ────────────────────────────────────────────────────────────
export type UserRole = "admin" | "doctor" | "nurse" | "receptionist" | "pharmacist" | "lab_tech";

// ── Permission matrix ─────────────────────────────────────────────────────────
// Each resource defines which roles have read/write access.
// PHI access follows the "minimum necessary" principle (§164.502(b)).
const PERMISSIONS: Record<string, { read: UserRole[]; write: UserRole[] }> = {
  patients: {
    read: ["admin", "doctor", "nurse", "receptionist"],
    write: ["admin", "doctor", "receptionist"],
  },
  appointments: {
    read: ["admin", "doctor", "nurse", "receptionist"],
    write: ["admin", "doctor", "receptionist"],
  },
  encounters: {
    read: ["admin", "doctor", "nurse"],
    write: ["admin", "doctor"],
  },
  clinical: {
    // Specialty clinical data — only clinicians
    read: ["admin", "doctor", "nurse"],
    write: ["admin", "doctor"],
  },
  orders: {
    read: ["admin", "doctor", "nurse", "pharmacist"],
    write: ["admin", "doctor"],
  },
  lab: {
    read: ["admin", "doctor", "nurse", "lab_tech"],
    write: ["admin", "doctor", "lab_tech"],
  },
  billing: {
    // Financial data — restricted to admin and billing roles
    read: ["admin", "receptionist"],
    write: ["admin", "receptionist"],
  },
  inventory: {
    read: ["admin", "pharmacist", "nurse"],
    write: ["admin", "pharmacist"],
  },
  staff: {
    // HR data — admin only
    read: ["admin", "doctor"],
    write: ["admin"],
  },
  assets: {
    read: ["admin"],
    write: ["admin"],
  },
  cme: {
    read: ["admin", "doctor"],
    write: ["admin", "doctor"],
  },
  reports: {
    read: ["admin", "doctor"],
    write: ["admin"],
  },
  icd10: {
    // ICD-10 master reference — all clinical roles can read
    read: ["admin", "doctor", "nurse", "pharmacist", "lab_tech", "receptionist"],
    write: ["admin"],
  },
  dicom: { read: ["admin", "doctor", "lab_tech"], write: ["admin", "doctor"] },
  exports: { read: ["admin"], write: ["admin"] },
  fhir: { read: ["admin", "doctor", "nurse", "lab_tech", "receptionist"], write: ["admin", "doctor"] },
  subscriptions: { read: ["admin"], write: ["admin"] },
};

// ── RBAC middleware factory ────────────────────────────────────────────────────
export function requireRole(...roles: UserRole[]) {
  return createMiddleware(async (c: Context, next) => {
    const payload = c.get("jwtPayload") as { sub: string; role: string } | undefined;
    if (!payload?.role) {
      return c.json({ error: "Forbidden", code: "INSUFFICIENT_ROLE" }, 403);
    }
    if (!roles.includes(payload.role as UserRole)) {
      return c.json({ error: "Forbidden", code: "INSUFFICIENT_ROLE" }, 403);
    }
    await next();
  });
}

// ── Resource-level RBAC middleware ────────────────────────────────────────────
export function requirePermission(resource: string, action: "read" | "write") {
  return createMiddleware(async (c: Context, next) => {
    const payload = c.get("jwtPayload") as { sub: string; role: string } | undefined;
    if (!payload?.role) {
      return c.json({ error: "Forbidden", code: "INSUFFICIENT_ROLE" }, 403);
    }

    const permission = PERMISSIONS[resource];
    if (!permission) {
      // Unknown resource — deny by default (fail-safe)
      return c.json({ error: "Forbidden", code: "UNKNOWN_RESOURCE" }, 403);
    }

    const allowedRoles = permission[action];
    if (!allowedRoles.includes(payload.role as UserRole)) {
      return c.json({ error: "Forbidden", code: "INSUFFICIENT_ROLE" }, 403);
    }

    await next();
  });
}

// ── Admin-only shorthand ──────────────────────────────────────────────────────
export const requireAdmin = requireRole("admin");

// ── Clinician shorthand (doctor + admin) ─────────────────────────────────────
export const requireClinician = requireRole("admin", "doctor");

// ── Get current user from JWT ─────────────────────────────────────────────────
export function getCurrentUser(c: Context): { sub: string; email: string; role: UserRole } {
  const payload = c.get("jwtPayload") as { sub: string; email: string; role: string };
  return payload as { sub: string; email: string; role: UserRole };
}
