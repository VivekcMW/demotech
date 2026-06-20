import { Hono } from "hono";
import { eq, sql, and, desc, asc, inArray } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db, schema } from "../db";

const icd10 = new Hono();

// ── ICD-10 Code Search ───────────────────────────────────────────────────
// Main search endpoint with full-text search, filters, and pagination
icd10.get("/search", async (c) => {
  const query = c.req.query("q") || "";
  const chapterId = c.req.query("chapter");
  const specialty = c.req.query("specialty");
  const billableOnly = c.req.query("billable") === "true";
  const chronicOnly = c.req.query("chronic") === "true";
  const limit = Math.min(Number.parseInt(c.req.query("limit") || "25"), 100);
  const offset = Number.parseInt(c.req.query("offset") || "0");

  // Build dynamic conditions
  const conditions: ReturnType<typeof eq>[] = [];

  if (query) {
    // Search by code prefix OR description (case-insensitive)
    conditions.push(
      sql`(
        ${schema.icd10Codes.code} ILIKE ${`${query}%`} OR
        ${schema.icd10Codes.code} ILIKE ${`%.${query}%`} OR
        ${schema.icd10Codes.shortDesc} ILIKE ${`%${query}%`} OR
        ${schema.icd10Codes.longDesc} ILIKE ${`%${query}%`} OR
        ${query} = ANY(${schema.icd10Codes.keywords})
      )`
    );
  }

  if (chapterId) {
    conditions.push(eq(schema.icd10Codes.chapterId, chapterId));
  }

  if (specialty) {
    conditions.push(sql`${specialty} = ANY(${schema.icd10Codes.commonSpecialties})`);
  }

  if (billableOnly) {
    conditions.push(eq(schema.icd10Codes.isBillable, true));
  }

  if (chronicOnly) {
    conditions.push(eq(schema.icd10Codes.isChronic, true));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Execute query with relevance ordering
  const results = await db
    .select({
      code: schema.icd10Codes.code,
      shortDesc: schema.icd10Codes.shortDesc,
      longDesc: schema.icd10Codes.longDesc,
      chapterId: schema.icd10Codes.chapterId,
      isBillable: schema.icd10Codes.isBillable,
      isChronic: schema.icd10Codes.isChronic,
      isComorbidity: schema.icd10Codes.isComorbidity,
      commonSpecialties: schema.icd10Codes.commonSpecialties,
    })
    .from(schema.icd10Codes)
    .where(whereClause)
    .orderBy(
      // Prioritize exact code matches, then short codes, then alphabetical
      sql`CASE 
        WHEN ${schema.icd10Codes.code} ILIKE ${`${query}%`} THEN 0
        WHEN ${schema.icd10Codes.code} ILIKE ${`%.${query}%`} THEN 1
        ELSE 2
      END`,
      asc(sql`LENGTH(${schema.icd10Codes.code})`),
      asc(schema.icd10Codes.code)
    )
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.icd10Codes)
    .where(whereClause);

  return c.json({
    data: results,
    total: countResult[0].count,
    limit,
    offset,
  });
});

// ── Get Single ICD-10 Code Details ───────────────────────────────────────
icd10.get("/code/:code", async (c) => {
  const code = c.req.param("code");
  const result = await db
    .select()
    .from(schema.icd10Codes)
    .where(eq(schema.icd10Codes.code, code))
    .limit(1);

  if (!result.length) {
    return c.json({ error: "ICD-10 code not found" }, 404);
  }

  // Get chapter info
  const chapter = await db
    .select()
    .from(schema.icd10Chapters)
    .where(eq(schema.icd10Chapters.id, result[0].chapterId))
    .limit(1);

  return c.json({
    ...result[0],
    chapter: chapter[0] || null,
  });
});

// ── Get All Chapters ─────────────────────────────────────────────────────
icd10.get("/chapters", async (c) => {
  const chapters = await db
    .select()
    .from(schema.icd10Chapters)
    .orderBy(asc(schema.icd10Chapters.id));

  return c.json({ data: chapters });
});

// ── Get Chapter with Categories ──────────────────────────────────────────
icd10.get("/chapters/:id", async (c) => {
  const chapterId = c.req.param("id");

  const chapter = await db
    .select()
    .from(schema.icd10Chapters)
    .where(eq(schema.icd10Chapters.id, chapterId))
    .limit(1);

  if (!chapter.length) {
    return c.json({ error: "Chapter not found" }, 404);
  }

  const categories = await db
    .select()
    .from(schema.icd10Categories)
    .where(eq(schema.icd10Categories.chapterId, chapterId))
    .orderBy(asc(schema.icd10Categories.code));

  return c.json({
    ...chapter[0],
    categories,
  });
});

// ── Get Categories ───────────────────────────────────────────────────────
icd10.get("/categories", async (c) => {
  const chapterId = c.req.query("chapter");

  const whereClause = chapterId
    ? eq(schema.icd10Categories.chapterId, chapterId)
    : undefined;

  const categories = await db
    .select()
    .from(schema.icd10Categories)
    .where(whereClause)
    .orderBy(asc(schema.icd10Categories.code));

  return c.json({ data: categories });
});

// ── Specialty Favorites (Quick Pick) ─────────────────────────────────────
icd10.get("/favorites/:specialty", async (c) => {
  const specialty = c.req.param("specialty");

  const favorites = await db
    .select({
      code: schema.icd10Codes.code,
      shortDesc: schema.icd10Codes.shortDesc,
      longDesc: schema.icd10Codes.longDesc,
      usageCount: schema.icd10SpecialtyFavorites.usageCount,
    })
    .from(schema.icd10SpecialtyFavorites)
    .innerJoin(
      schema.icd10Codes,
      eq(schema.icd10SpecialtyFavorites.icdCode, schema.icd10Codes.code)
    )
    .where(eq(schema.icd10SpecialtyFavorites.specialty, specialty))
    .orderBy(
      desc(schema.icd10SpecialtyFavorites.usageCount),
      asc(schema.icd10SpecialtyFavorites.displayOrder)
    )
    .limit(20);

  return c.json({ data: favorites });
});

// ── Record Code Usage (for learning favorites) ───────────────────────────
const usageSchema = z.object({
  icdCode: z.string(),
  specialty: z.string(),
});

icd10.post("/usage", zValidator("json", usageSchema), async (c) => {
  const { icdCode, specialty } = c.req.valid("json");

  // Upsert: increment usage count or create new favorite
  await db
    .insert(schema.icd10SpecialtyFavorites)
    .values({
      specialty,
      icdCode,
      usageCount: 1,
    })
    .onConflictDoUpdate({
      target: [schema.icd10SpecialtyFavorites.specialty, schema.icd10SpecialtyFavorites.icdCode],
      set: {
        usageCount: sql`${schema.icd10SpecialtyFavorites.usageCount} + 1`,
      },
    });

  return c.json({ success: true });
});

// ── Get Chronic Conditions ───────────────────────────────────────────────
icd10.get("/chronic", async (c) => {
  const limit = Math.min(Number.parseInt(c.req.query("limit") || "50"), 200);
  const query = c.req.query("q") || "";

  const conditions: ReturnType<typeof eq>[] = [eq(schema.icd10Codes.isChronic, true)];

  if (query) {
    conditions.push(
      sql`(
        ${schema.icd10Codes.code} ILIKE ${`${query}%`} OR
        ${schema.icd10Codes.shortDesc} ILIKE ${`%${query}%`}
      )`
    );
  }

  const results = await db
    .select({
      code: schema.icd10Codes.code,
      shortDesc: schema.icd10Codes.shortDesc,
      longDesc: schema.icd10Codes.longDesc,
      hccCategory: schema.icd10Codes.hccCategory,
    })
    .from(schema.icd10Codes)
    .where(and(...conditions))
    .orderBy(asc(schema.icd10Codes.code))
    .limit(limit);

  return c.json({ data: results });
});

// ── Get Codes by Specialty ───────────────────────────────────────────────
icd10.get("/specialty/:specialty", async (c) => {
  const specialty = c.req.param("specialty");
  const limit = Math.min(Number.parseInt(c.req.query("limit") || "50"), 200);

  const results = await db
    .select({
      code: schema.icd10Codes.code,
      shortDesc: schema.icd10Codes.shortDesc,
      longDesc: schema.icd10Codes.longDesc,
      isChronic: schema.icd10Codes.isChronic,
      commonSpecialties: schema.icd10Codes.commonSpecialties,
    })
    .from(schema.icd10Codes)
    .where(sql`${specialty} = ANY(${schema.icd10Codes.commonSpecialties})`)
    .orderBy(asc(schema.icd10Codes.code))
    .limit(limit);

  return c.json({ data: results });
});

// ── ICD-10-PCS Procedure Search ──────────────────────────────────────────
icd10.get("/pcs/search", async (c) => {
  const query = c.req.query("q") || "";
  const section = c.req.query("section");
  const bodySystem = c.req.query("body_system");
  const limit = Math.min(Number.parseInt(c.req.query("limit") || "25"), 100);
  const offset = Number.parseInt(c.req.query("offset") || "0");

  const conditions: ReturnType<typeof eq>[] = [];

  if (query) {
    conditions.push(
      sql`(
        ${schema.icd10PcsCodes.code} ILIKE ${`${query}%`} OR
        ${schema.icd10PcsCodes.shortDesc} ILIKE ${`%${query}%`} OR
        ${schema.icd10PcsCodes.longDesc} ILIKE ${`%${query}%`}
      )`
    );
  }

  if (section) {
    conditions.push(eq(schema.icd10PcsCodes.section, section));
  }

  if (bodySystem) {
    conditions.push(eq(schema.icd10PcsCodes.bodySystem, bodySystem));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select()
    .from(schema.icd10PcsCodes)
    .where(whereClause)
    .orderBy(asc(schema.icd10PcsCodes.code))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.icd10PcsCodes)
    .where(whereClause);

  return c.json({
    data: results,
    total: countResult[0].count,
    limit,
    offset,
  });
});

// ── Validate ICD-10 Codes ────────────────────────────────────────────────
const validateSchema = z.object({
  codes: z.array(z.string()).min(1).max(50),
});

icd10.post("/validate", zValidator("json", validateSchema), async (c) => {
  const { codes } = c.req.valid("json");

  const validCodes = await db
    .select({ code: schema.icd10Codes.code, isBillable: schema.icd10Codes.isBillable })
    .from(schema.icd10Codes)
    .where(inArray(schema.icd10Codes.code, codes));

  const validCodeSet = new Set(validCodes.map((v) => v.code));
  const invalidCodes = codes.filter((code) => !validCodeSet.has(code));
  const billableCodes = validCodes.filter((v) => v.isBillable).map((v) => v.code);
  const nonBillableCodes = validCodes.filter((v) => !v.isBillable).map((v) => v.code);

  return c.json({
    valid: invalidCodes.length === 0,
    invalidCodes,
    billableCodes,
    nonBillableCodes,
    totalSubmitted: codes.length,
    totalValid: validCodes.length,
  });
});

// ── Statistics ───────────────────────────────────────────────────────────
icd10.get("/stats", async (c) => {
  const [totalCodes] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.icd10Codes);
  const [billable] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.icd10Codes).where(eq(schema.icd10Codes.isBillable, true));
  const [chronic] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.icd10Codes).where(eq(schema.icd10Codes.isChronic, true));
  const [chapters] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.icd10Chapters);
  const [pcsCodes] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.icd10PcsCodes);

  return c.json({
    totalCodes: totalCodes.count,
    billableCodes: billable.count,
    chronicCodes: chronic.count,
    chapters: chapters.count,
    pcsCodes: pcsCodes.count,
  });
});

export default icd10;
