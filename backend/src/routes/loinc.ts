import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  searchLoinc,
  getLoincByCode,
  mapTestToLoinc,
  getMappedTests,
  getUnmappedTests,
  getLoincCategories,
  searchByLoincClass,
} from "../loinc";

const loinc = new Hono();

loinc.get("/search", async (c) => {
  const q = c.req.query("q");
  if (!q) return c.json({ error: "Search query required" }, 400);
  const results = await searchLoinc(q);
  return c.json({ data: results, count: results.length });
});

loinc.get("/:loincNum", async (c) => {
  const loincNum = c.req.param("loincNum");
  const result = await getLoincByCode(loincNum);
  if (!result) return c.json({ error: "LOINC code not found" }, 404);
  return c.json(result);
});

loinc.post("/map", async (c) => {
  const { testId, loincNum } = await c.req.json();
  if (!testId || !loincNum) return c.json({ error: "testId and loincNum required" }, 400);
  const success = await mapTestToLoinc(testId, loincNum);
  if (!success) return c.json({ error: "Mapping failed — LOINC code not found" }, 400);
  return c.json({ success: true });
});

loinc.get("/mapped", async (c) => {
  const tests = await getMappedTests();
  return c.json({ data: tests, count: tests.length });
});

loinc.get("/unmapped", async (c) => {
  const tests = await getUnmappedTests();
  return c.json({ data: tests, count: tests.length });
});

loinc.get("/categories", async (c) => {
  const categories = await getLoincCategories();
  return c.json({ data: categories });
});

loinc.get("/category/:classType", async (c) => {
  const classType = c.req.param("classType");
  const codes = await searchByLoincClass(classType);
  return c.json({ data: codes, count: codes.length });
});

export default loinc;
