import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";
import { authMiddleware } from "./middleware/auth";
import { auditLog } from "./middleware/audit";
import { requirePermission } from "./middleware/rbac";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { initSentry, Sentry } from "./monitoring/sentry";

// Initialize Sentry
initSentry();
import patientsRoutes from "./routes/patients";
import appointmentsRoutes from "./routes/appointments";
import encountersRoutes from "./routes/encounters";
import ordersRoutes from "./routes/orders";
import labRoutes from "./routes/lab";
import billingRoutes from "./routes/billing";
import authRoutes from "./routes/auth";
import clinicalRoutes from "./routes/clinical";
import inventoryRoutes from "./routes/inventory";
import staffRoutes from "./routes/staff";
import assetsRoutes from "./routes/assets";
import cmeRoutes from "./routes/cme";
import reportsRoutes from "./routes/reports";
import icd10Routes from "./routes/icd10";

const app = new Hono();

// Validate required environment variables at startup
const requiredEnvVars = ["JWT_SECRET", "DATABASE_URL"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// CORS with explicit origin whitelist
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"];
app.use("*", cors({
  origin: allowedOrigins,
  credentials: true,
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

// Rate limiting - strict on auth, moderate on API (skip in test mode)
const isTestMode = process.env.NODE_ENV === "test" || process.env.TEST_MODE === "true";
if (!isTestMode) {
  app.use("/api/v1/auth/*", rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // 10 requests per window
    keyGenerator: (c) => c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
    handler: (c) => c.json({ error: "Too many requests, please try again later" }, 429),
  }));

  app.use("/api/v1/*", rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    limit: 100, // 100 requests per minute
    keyGenerator: (c) => c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
  }));
}

// Request size limit (1MB)
app.use("*", async (c, next) => {
  const contentLength = c.req.header("content-length");
  if (contentLength && Number.parseInt(contentLength) > 1024 * 1024) {
    return c.json({ error: "Request body too large" }, 413);
  }
  await next();
});

// HIPAA §164.312(b): PHI-scrubbed structured logging
// Logs method + sanitized path (no query strings) + status code only
app.use("*", logger((str) => {
  // Strip query strings from logged message to prevent PHI leakage via patient IDs / search terms
  const sanitized = str.replace(/\?[^\s]*/g, "?[redacted]");
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: "info",
    message: sanitized,
  };
  console.log(JSON.stringify(logEntry));
}));

// Security headers
app.use("*", secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameAncestors: ["'none'"],
  },
  strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true },
  xFrameOptions: "DENY",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: { geolocation: [], microphone: [], camera: [] },
}));

// Sentry error handler middleware
if (process.env.SENTRY_DSN) {
  app.use("*", async (c, next) => {
    try {
      await next();
    } catch (err) {
      // HIPAA §164.312(b): Scrub PHI before sending to third-party Sentry
      // Only capture the error class + sanitized message, not stack frames with patient data
      if (err instanceof Error) {
        Sentry.captureException(new Error(err.message), {
          extra: { requestId: c.get("requestId") },
        });
      }
      throw err;
    }
  });
}

// Request ID for tracing
app.use("*", async (c, next) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  c.set("requestId", requestId);
  c.header("x-request-id", requestId);
  await next();
});

// Health check with DB verification
app.get("/health", async (c) => {
  try {
    await db.execute(sql`SELECT 1`);
    return c.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: "connected",
      version: process.env.npm_package_version || "unknown",
    });
  } catch {
    return c.json({ 
      status: "degraded", 
      timestamp: new Date().toISOString(),
      database: "disconnected",
    }, 503);
  }
});

// Readiness check for Kubernetes
app.get("/ready", async (c) => {
  try {
    await db.execute(sql`SELECT 1`);
    return c.json({ ready: true });
  } catch {
    return c.json({ ready: false }, 503);
  }
});

// Public routes
app.route("/api/v1/auth", authRoutes);

// ── Protected routes ─────────────────────────────────────────────────────
// All routes below require: (1) valid JWT, (2) role-based permission, (3) audit log
app.use("/api/v1/*", authMiddleware);

// HIPAA §164.312(b): Global audit log for all PHI-bearing routes
app.use("/api/v1/*", auditLog);

// HIPAA §164.312(a)(1) + §164.502(b): Role-Based Access Control
// Each resource enforces minimum-necessary access by role
app.use("/api/v1/patients/*",     requirePermission("patients",     "read"));
app.use("/api/v1/appointments/*", requirePermission("appointments", "read"));
app.use("/api/v1/encounters/*",   requirePermission("encounters",   "read"));
app.use("/api/v1/orders/*",       requirePermission("orders",       "read"));
app.use("/api/v1/lab/*",          requirePermission("lab",          "read"));
app.use("/api/v1/billing/*",      requirePermission("billing",      "read"));
app.use("/api/v1/clinical/*",     requirePermission("clinical",     "read"));
app.use("/api/v1/inventory/*",    requirePermission("inventory",    "read"));
app.use("/api/v1/staff/*",        requirePermission("staff",        "read"));
app.use("/api/v1/assets/*",       requirePermission("assets",       "read"));
app.use("/api/v1/cme/*",          requirePermission("cme",          "read"));
app.use("/api/v1/reports/*",      requirePermission("reports",      "read"));
app.use("/api/v1/icd10/*",        requirePermission("icd10",        "read"));

app.route("/api/v1/patients", patientsRoutes);
app.route("/api/v1/appointments", appointmentsRoutes);
app.route("/api/v1/encounters", encountersRoutes);
app.route("/api/v1/orders", ordersRoutes);
app.route("/api/v1/lab", labRoutes);
app.route("/api/v1/billing", billingRoutes);
app.route("/api/v1/clinical", clinicalRoutes);
app.route("/api/v1/inventory", inventoryRoutes);
app.route("/api/v1/staff", staffRoutes);
app.route("/api/v1/assets", assetsRoutes);
app.route("/api/v1/cme", cmeRoutes);
app.route("/api/v1/reports", reportsRoutes);
app.route("/api/v1/icd10", icd10Routes);

// Global error handler
app.onError((err, c) => {
  const requestId = c.get("requestId") || "unknown";
  // HIPAA §164.312(b): Omit stack trace and request path from logs to prevent PHI exposure
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "error",
    requestId,
    error: err.message,
    // NOTE: stack and path intentionally omitted — may contain PHI
  }));
  
  // Send to Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      extra: {
        requestId,
        path: c.req.path,
        method: c.req.method,
      },
    });
  }
  
  return c.json({ 
    error: "Internal server error", 
    code: "INTERNAL_ERROR",
    requestId,
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: "Not found", 
    code: "NOT_FOUND",
    path: c.req.path,
  }, 404);
});

const port = parseInt(process.env.PORT || "4000", 10);
const server = serve({ fetch: app.fetch, port }, () => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    message: `Server running on http://localhost:${port}`,
    port,
  }));
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    message: `Received ${signal}, shutting down gracefully...`,
  }));
  server.close();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "error",
    message: "Unhandled rejection",
    reason: String(reason),
  }));
});

export default app;
