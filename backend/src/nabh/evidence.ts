import { db } from "../db";
import { nabhEvidencePacks, nabhIndicatorValues, nabhIndicatorDefinitions, nabhCommitteeReports, nabhRegisters } from "../db/schema";
import { and, eq, gte, lte, desc, sql } from "drizzle-orm";

export interface EvidencePackOptions {
  title: string;
  nabhStandard?: string;
  periodStart: string;
  periodEnd: string;
  includeIndicators?: boolean;
  includeCommittees?: boolean;
  includeRegisters?: boolean;
  generatedBy: string;
}

export async function generateEvidencePack(options: EvidencePackOptions) {
  const id = `EP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const pack: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    period: { start: options.periodStart, end: options.periodEnd },
    summary: {},
  };

  if (options.includeIndicators !== false) {
    const indicators = await db
      .select({
        id: nabhIndicatorDefinitions.id,
        name: nabhIndicatorDefinitions.name,
        category: nabhIndicatorDefinitions.category,
        nabhStandard: nabhIndicatorDefinitions.nabhStandard,
        targetRate: nabhIndicatorDefinitions.targetRate,
      })
      .from(nabhIndicatorDefinitions)
      .where(eq(nabhIndicatorDefinitions.active, true));

    const values = await db
      .select()
      .from(nabhIndicatorValues)
      .where(
        and(
          gte(nabhIndicatorValues.periodStart, options.periodStart),
          lte(nabhIndicatorValues.periodEnd, options.periodEnd),
        ),
      )
      .orderBy(desc(nabhIndicatorValues.computedAt));

    const indicatorData = indicators.map((def) => {
      const val = values.find((v) => v.indicatorId === def.id);
      return {
        indicator: def.name,
        category: def.category,
        nabhStandard: def.nabhStandard,
        targetRate: def.targetRate,
        numerator: val?.numerator || "0",
        denominator: val?.denominator || "0",
        rate: val?.rate || "0",
        period: val ? `${val.periodStart} to ${val.periodEnd}` : "N/A",
        status: val
          ? Number(val.rate) >= Number(def.targetRate || 0)
            ? "achieved"
            : "below_target"
          : "not_computed",
      };
    });

    pack.indicators = indicatorData;
    pack.summary = {
      ...(pack.summary as Record<string, unknown>),
      totalIndicators: indicatorData.length,
      achieved: indicatorData.filter((i) => i.status === "achieved").length,
      belowTarget: indicatorData.filter((i) => i.status === "below_target").length,
      notComputed: indicatorData.filter((i) => i.status === "not_computed").length,
    };
  }

  if (options.includeCommittees !== false) {
    const committees = await db
      .select()
      .from(nabhCommitteeReports)
      .where(
        and(
          gte(nabhCommitteeReports.meetingDate, options.periodStart),
          lte(nabhCommitteeReports.meetingDate, options.periodEnd),
        ),
      )
      .orderBy(desc(nabhCommitteeReports.meetingDate));

    pack.committeeReports = committees;
    (pack.summary as Record<string, unknown>).committeeMeetingCount = committees.length;
  }

  if (options.includeRegisters !== false) {
    const registers = await db
      .select()
      .from(nabhRegisters)
      .where(
        and(
          gte(nabhRegisters.recordedAt, new Date(options.periodStart)),
          lte(nabhRegisters.recordedAt, new Date(options.periodEnd)),
        ),
      )
      .orderBy(desc(nabhRegisters.recordedAt));

    pack.statutoryRegisters = registers;
    (pack.summary as Record<string, unknown>).registerCount = registers.length;
  }

  const [result] = await db
    .insert(nabhEvidencePacks)
    .values({
      id,
      title: options.title,
      nabhStandard: options.nabhStandard,
      periodStart: options.periodStart,
      periodEnd: options.periodEnd,
      status: "draft",
      package: pack as Record<string, unknown>,
      generatedBy: options.generatedBy,
    })
    .returning();

  return result;
}

export async function finalizeEvidencePack(id: string) {
  const [result] = await db
    .update(nabhEvidencePacks)
    .set({ status: "final" })
    .where(eq(nabhEvidencePacks.id, id))
    .returning();
  return result;
}

export async function queryEvidencePacks(params: {
  status?: string;
  nabhStandard?: string;
  page?: number;
  limit?: number;
}) {
  const { status, nabhStandard, page = 1, limit = 50 } = params;
  const conditions = [];

  if (status) conditions.push(eq(nabhEvidencePacks.status, status));
  if (nabhStandard) conditions.push(eq(nabhEvidencePacks.nabhStandard, nabhStandard));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [total, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(nabhEvidencePacks).where(where),
    db
      .select()
      .from(nabhEvidencePacks)
      .where(where)
      .orderBy(desc(nabhEvidencePacks.generatedAt))
      .limit(limit)
      .offset((page - 1) * limit),
  ]);

  return {
    data: rows,
    total: Number(total[0]?.count || 0),
    page,
    limit,
    totalPages: Math.ceil(Number(total[0]?.count || 0) / limit),
  };
}

export async function getEvidencePackById(id: string) {
  return db.query.nabhEvidencePacks.findFirst({
    where: eq(nabhEvidencePacks.id, id),
  });
}

export async function exportEvidencePack(id: string, format: "json" | "csv" = "json") {
  const pack = await getEvidencePackById(id);
  if (!pack) return null;

  await db
    .update(nabhEvidencePacks)
    .set({ exportedAt: new Date(), format })
    .where(eq(nabhEvidencePacks.id, id));

  if (format === "json") {
    return pack.package;
  }

  const data = pack.package as Record<string, unknown>;
  const csvLines: string[] = [];

  if (data.indicators && Array.isArray(data.indicators)) {
    csvLines.push("Indicator,Category,NABH Standard,Target Rate,Numerator,Denominator,Rate,Status");
    for (const ind of data.indicators) {
      csvLines.push(
        `${ind.indicator},${ind.category},${ind.nabhStandard},${ind.targetRate},${ind.numerator},${ind.denominator},${ind.rate},${ind.status}`,
      );
    }
  }

  if (data.committeeReports && Array.isArray(data.committeeReports)) {
    csvLines.push("");
    csvLines.push("Committee,Meeting Date,Chairperson,Attendees,Minutes");
    for (const cr of data.committeeReports) {
      csvLines.push(
        `${cr.committee},${cr.meetingDate},${cr.chairperson || ""},${(cr.attendees || []).length},${(cr.minutes || "").slice(0, 100)}`,
      );
    }
  }

  return csvLines.join("\n");
}
