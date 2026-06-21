import { db } from "../db";
import { loincCodes, labTestCatalog } from "../db/schema";
import { eq, ilike, sql, and, or, asc } from "drizzle-orm";

export async function searchLoinc(query: string) {
  const term = `%${query}%`;
  return db.query.loincCodes.findMany({
    where: or(
      ilike(loincCodes.component, term),
      ilike(loincCodes.longCommonName, term),
      ilike(loincCodes.shortName, term),
      ilike(loincCodes.loincNum, term),
    ),
    limit: 50,
    orderBy: [asc(loincCodes.component)],
  });
}

export async function getLoincByCode(loincNum: string) {
  return db.query.loincCodes.findFirst({
    where: eq(loincCodes.loincNum, loincNum),
  });
}

export async function mapTestToLoinc(
  testId: string,
  loincNum: string,
): Promise<boolean> {
  const loinc = await getLoincByCode(loincNum);
  if (!loinc) return false;

  const [result] = await db.update(labTestCatalog)
    .set({ loincCode: loincNum })
    .where(eq(labTestCatalog.id, testId))
    .returning();
  return !!result;
}

export async function getMappedTests() {
  return db.query.labTestCatalog.findMany({
    where: sql`${labTestCatalog.loincCode} IS NOT NULL`,
    orderBy: [asc(labTestCatalog.name)],
  });
}

export async function getUnmappedTests() {
  return db.query.labTestCatalog.findMany({
    where: sql`${labTestCatalog.loincCode} IS NULL`,
    orderBy: [asc(labTestCatalog.name)],
  });
}

export async function getLoincCategories() {
  return db.select({
    classType: loincCodes.classType,
    count: sql<number>`count(*)::int`,
  })
    .from(loincCodes)
    .groupBy(loincCodes.classType)
    .orderBy(asc(loincCodes.classType));
}

export async function searchByLoincClass(classType: string) {
  return db.query.loincCodes.findMany({
    where: eq(loincCodes.classType, classType),
    limit: 100,
    orderBy: [asc(loincCodes.component)],
  });
}
