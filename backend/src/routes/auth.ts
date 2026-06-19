import { Hono } from "hono";
import { sign } from "hono/jwt";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";
import { db, schema } from "../db";
import { JWT_SECRET } from "../middleware/auth";

const auth = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user.length) return c.json({ error: "Invalid credentials" }, 401);

  const valid = await bcrypt.compare(password, user[0].passwordHash);
  if (!valid) return c.json({ error: "Invalid credentials" }, 401);

  if (!user[0].active) return c.json({ error: "Account deactivated" }, 403);

  const token = await sign(
    { sub: user[0].id, email: user[0].email, role: user[0].role, exp: Math.floor(Date.now() / 1000) + 86400 },
    JWT_SECRET
  );

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

auth.post("/seed-user", async (c) => {
  const hash = await bcrypt.hash("Doctor@123", 10);
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, "doctor@aarogya.app")).limit(1);
  if (existing.length) return c.json({ message: "Seed user exists" });

  await db.insert(schema.users).values({
    id: "USR-001",
    email: "doctor@aarogya.app",
    passwordHash: hash,
    role: "admin",
    staffId: "EMP-001",
  });

  return c.json({ message: "Seed user created" });
});

export default auth;
