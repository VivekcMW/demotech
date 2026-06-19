import { Hono } from "hono";
import { eq, sql, desc } from "drizzle-orm";
import { db, schema } from "../db";

const reports = new Hono();

reports.get("/revenue/daily", async (c) => {
  const days = parseInt(c.req.query("days") || "7");
  const result = await db.execute(sql`
    SELECT date(created_at) as day, sum(net_amount) as revenue, count(*) as bills
    FROM billing
    WHERE created_at >= now() - make_interval(days => ${days})
    GROUP BY date(created_at) ORDER BY day DESC
  `);
  return c.json({ data: result });
});

reports.get("/revenue/monthly", async (c) => {
  const year = parseInt(c.req.query("year") || "2026");
  const result = await db.execute(sql`
    SELECT to_char(created_at, 'YYYY-MM') as month, sum(net_amount) as revenue, count(*) as bills
    FROM billing
    WHERE extract(year from created_at) = ${year}
    GROUP BY month ORDER BY month
  `);
  return c.json({ data: result });
});

reports.get("/occupancy", async (c) => {
  // IPD occupancy summary (placeholder for bed management integration)
  return c.json({
    totalBeds: 120,
    occupied: 87,
    occupancyRate: "72.5%",
    byWard: [
      { ward: "General", total: 60, occupied: 48 },
      { ward: "ICU", total: 15, occupied: 12 },
      { ward: "Maternity", total: 20, occupied: 14 },
      { ward: "Pediatrics", total: 15, occupied: 8 },
      { ward: "Private", total: 10, occupied: 5 },
    ],
  });
});

reports.get("/clinical/stats", async (c) => {
  const days = parseInt(c.req.query("days") || "30");
  const result = await db.execute(sql`
    SELECT
      department,
      count(*) as encounters,
      count(distinct patient_id) as unique_patients
    FROM encounters
    WHERE created_at >= now() - make_interval(days => ${days})
    GROUP BY department ORDER BY encounters DESC
  `);
  return c.json({ data: result });
});

reports.get("/inventory/low-stock", async (c) => {
  const result = await db.select().from(schema.inventory)
    .where(sql`${schema.inventory.stock} <= ${schema.inventory.reorderLevel}`);
  return c.json({ data: result, count: result.length });
});

reports.get("/lab/turnaround", async (c) => {
  const days = parseInt(c.req.query("days") || "7");
  const result = await db.execute(sql`
    SELECT test_id,
      avg(extract(epoch from (resulted_at - collected_at))/3600) as avg_hours,
      count(*) as tests
    FROM lab_orders
    WHERE resulted_at IS NOT NULL
      AND collected_at IS NOT NULL
      AND created_at >= now() - make_interval(days => ${days})
    GROUP BY test_id
  `);
  return c.json({ data: result });
});

export default reports;
