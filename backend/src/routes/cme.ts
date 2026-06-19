import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db, schema } from "../db";

const cme = new Hono();

cme.get("/", async (c) => {
  const staffId = c.req.query("staff_id");
  const pending = c.req.query("pending") === "true";
  let query = db.select().from(schema.cmeRecords);
  if (staffId) query = query.where(eq(schema.cmeRecords.staffId, staffId));
  if (pending) query = query.where(eq(schema.cmeRecords.completed, false));
  return c.json({ data: await query });
});

cme.get("/credits/:staffId", async (c) => {
  const records = await db.select().from(schema.cmeRecords)
    .where(and(eq(schema.cmeRecords.staffId, c.req.param("staffId")), eq(schema.cmeRecords.completed, true)));
  const total = records.reduce((sum, r) => sum + r.credits, 0);
  return c.json({ staffId: c.req.param("staffId"), totalCredits: total, records: records.length });
});

export default cme;
