import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "../db";

const assets = new Hono();

assets.get("/", async (c) => {
  const status = c.req.query("status");
  let query = db.select().from(schema.assets);
  if (status) query = query.where(eq(schema.assets.status, status));
  return c.json({ data: await query });
});

assets.patch("/:id/status", async (c) => {
  const { status } = await c.req.json();
  await db.update(schema.assets).set({ status }).where(eq(schema.assets.id, c.req.param("id")));
  return c.json({ success: true });
});

export default assets;
