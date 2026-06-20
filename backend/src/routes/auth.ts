import { Hono } from "hono";
import { sign } from "hono/jwt";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";
import { db, schema } from "../db";
import { JWT_SECRET } from "../middleware/auth";
import { writeAuditLog } from "../middleware/audit";

const auth = new Hono();

// HIPAA §164.312(d): Password complexity requirements
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// HIPAA §164.312(d): Max failed login attempts before lockout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
             c.req.header("x-real-ip") ||
             "unknown";
  const requestId = c.get("requestId") as string || "unknown";

  // §164.312(d): Check for brute-force lockout
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000);
  const recentFailures = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.loginAttempts)
    .where(
      sql`email = ${email} AND success = false AND attempted_at > ${windowStart}`
    );

  if (Number(recentFailures[0].count) >= MAX_FAILED_ATTEMPTS) {
    // Record this blocked attempt
    await db.insert(schema.loginAttempts).values({ email, ipAddress: ip, success: false });
    await writeAuditLog({
      userId: email,
      userRole: "unknown",
      action: "LOGIN_FAILED",
      resource: "auth",
      outcome: "FAILURE",
      requestId,
      ipAddress: ip,
      details: "Account temporarily locked due to too many failed attempts",
    });
    return c.json({ error: "Account temporarily locked. Try again in 15 minutes." }, 429);
  }

  const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

  // Constant-time comparison to prevent user enumeration
  const dummyHash = "$2b$10$invalidhashfordummycomparison12345678901234567890";
  const valid = user.length
    ? await bcrypt.compare(password, user[0].passwordHash)
    : await bcrypt.compare(password, dummyHash).then(() => false);

  // Record the attempt
  await db.insert(schema.loginAttempts).values({ email, ipAddress: ip, success: !!(user.length && valid) });

  if (!user.length || !valid) {
    await writeAuditLog({
      userId: email,
      userRole: "unknown",
      action: "LOGIN_FAILED",
      resource: "auth",
      outcome: "FAILURE",
      requestId,
      ipAddress: ip,
    });
    return c.json({ error: "Invalid credentials" }, 401);
  }

  if (!user[0].active) {
    await writeAuditLog({
      userId: user[0].id,
      userRole: user[0].role,
      action: "LOGIN_FAILED",
      resource: "auth",
      outcome: "FAILURE",
      requestId,
      ipAddress: ip,
      details: "Account deactivated",
    });
    return c.json({ error: "Account deactivated" }, 403);
  }

  // Update last login timestamp
  await db.update(schema.users).set({ lastLogin: new Date() }).where(eq(schema.users.id, user[0].id));

  // §164.312(a)(2)(iii): Short-lived access token (8 hours) + role in payload
  const token = await sign(
    {
      sub: user[0].id,
      email: user[0].email,
      role: user[0].role,
      exp: Math.floor(Date.now() / 1000) + 8 * 3600, // 8 hours (reduced from 24h)
    },
    JWT_SECRET
  );

  await writeAuditLog({
    userId: user[0].id,
    userRole: user[0].role,
    action: "LOGIN",
    resource: "auth",
    outcome: "SUCCESS",
    requestId,
    ipAddress: ip,
  });

  return c.json({
    token,
    user: {
      id: user[0].id,
      email: user[0].email,
      role: user[0].role,
      staffId: user[0].staffId,
    },
  });
});

// §164.312(a)(2)(i): Removed public /seed-user endpoint.
// Creating admin accounts must go through the authenticated admin interface only.

export default auth;
