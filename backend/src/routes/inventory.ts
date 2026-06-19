import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "../db";

const inventory = new Hono();

inventory.get("/", async (c) => {
  const dept = c.req.query("department");
  const low = c.req.query("low") === "true";
  let query = db.select().from(schema.inventory);
  if (dept) query = query.where(eq(schema.inventory.department, dept));
  if (low) query = query.where(sql`${schema.inventory.stock} <= ${schema.inventory.reorderLevel}`);
  return c.json({ data: await query });
});

inventory.patch("/:id/stock", async (c) => {
  const { delta } = await c.req.json();
  const item = await db.select().from(schema.inventory).where(eq(schema.inventory.id, c.req.param("id"))).limit(1);
  if (!item.length) return c.json({ error: "Not found" }, 404);
  const newStock = Math.max(0, item[0].stock + delta);
  await db.update(schema.inventory).set({ stock: newStock }).where(eq(schema.inventory.id, c.req.param("id")));
  return c.json({ stock: newStock });
});

inventory.post("/:id/restock", async (c) => {
  const { qty } = await c.req.json();
  const item = await db.select().from(schema.inventory).where(eq(schema.inventory.id, c.req.param("id"))).limit(1);
  if (!item.length) return c.json({ error: "Not found" }, 404);
  const newStock = item[0].stock + qty;
  await db.update(schema.inventory).set({ stock: newStock, lastRestocked: new Date().toISOString().slice(0, 10) })
    .where(eq(schema.inventory.id, c.req.param("id")));
  return c.json({ stock: newStock });
});

export default inventory;
