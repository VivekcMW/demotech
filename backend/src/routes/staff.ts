import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";

const staff = new Hono();

staff.get("/", async (c) => {
  const dept = c.req.query("department");
  let query = db.select().from(schema.staff);
  if (dept) query = query.where(eq(schema.staff.department, dept));
  return c.json({ data: await query });
});

staff.get("/:id", async (c) => {
  const result = await db.select().from(schema.staff).where(eq(schema.staff.id, c.req.param("id"))).limit(1);
  return result.length ? c.json(result[0]) : c.json({ error: "Not found" }, 404);
});

staff.get("/stats/counts", async (c) => {
  const all = await db.select().from(schema.staff);
  return c.json({
    total: all.length,
    active: all.filter((s) => s.status === "Active").length,
    onLeave: all.filter((s) => s.status === "On Leave").length,
  });
});

export default staff;
