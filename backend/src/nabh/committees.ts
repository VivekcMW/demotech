import { db } from "../db";
import { nabhCommitteeReports } from "../db/schema";
import { and, eq, gte, lte, desc, sql } from "drizzle-orm";

export const COMMITTEE_TYPES = [
  "Infection Control Committee",
  "Mortality Review Committee",
  "Safety Committee",
  "Pharmacy & Therapeutics Committee",
  "Ethics Committee",
  "Quality Assurance Committee",
  "Medical Audit Committee",
  "Blood Transfusion Committee",
] as const;

export type CommitteeType = (typeof COMMITTEE_TYPES)[number];

interface CreateCommitteeReport {
  committee: CommitteeType;
  meetingDate: string;
  chairperson?: string;
  attendees?: string[];
  agenda?: string[];
  minutes?: string;
  decisions?: { decision: string; responsible: string; deadline?: string }[];
  actionItems?: { item: string; assignedTo: string; dueDate?: string; status?: string }[];
  createdBy: string;
}

export async function createCommitteeReport(data: CreateCommitteeReport) {
  const id = `CR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const [result] = await db
    .insert(nabhCommitteeReports)
    .values({
      id,
      committee: data.committee,
      meetingDate: data.meetingDate,
      chairperson: data.chairperson,
      attendees: (data.attendees || []) as unknown as Record<string, unknown>,
      agenda: (data.agenda || []) as unknown as Record<string, unknown>,
      minutes: data.minutes,
      decisions: (data.decisions || []) as unknown as Record<string, unknown>,
      actionItems: (data.actionItems || []) as unknown as Record<string, unknown>,
      createdBy: data.createdBy,
    })
    .returning();

  return result;
}

export async function updateCommitteeReport(
  id: string,
  data: Partial<CreateCommitteeReport>,
) {
  const updateData: Record<string, unknown> = {};
  if (data.committee) updateData.committee = data.committee;
  if (data.meetingDate) updateData.meetingDate = data.meetingDate;
  if (data.chairperson !== undefined) updateData.chairperson = data.chairperson;
  if (data.attendees) updateData.attendees = data.attendees as unknown as Record<string, unknown>;
  if (data.agenda) updateData.agenda = data.agenda as unknown as Record<string, unknown>;
  if (data.minutes !== undefined) updateData.minutes = data.minutes;
  if (data.decisions) updateData.decisions = data.decisions as unknown as Record<string, unknown>;
  if (data.actionItems) updateData.actionItems = data.actionItems as unknown as Record<string, unknown>;

  const [result] = await db
    .update(nabhCommitteeReports)
    .set(updateData)
    .where(eq(nabhCommitteeReports.id, id))
    .returning();

  return result;
}

export async function queryCommitteeReports(params: {
  committee?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}) {
  const { committee, fromDate, toDate, page = 1, limit = 50 } = params;
  const conditions = [];

  if (committee) conditions.push(eq(nabhCommitteeReports.committee, committee));
  if (fromDate) conditions.push(gte(nabhCommitteeReports.meetingDate, fromDate));
  if (toDate) conditions.push(lte(nabhCommitteeReports.meetingDate, toDate));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [total, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(nabhCommitteeReports).where(where),
    db
      .select()
      .from(nabhCommitteeReports)
      .where(where)
      .orderBy(desc(nabhCommitteeReports.meetingDate))
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

export async function getCommitteeReportById(id: string) {
  return db.query.nabhCommitteeReports.findFirst({
    where: eq(nabhCommitteeReports.id, id),
  });
}

export async function getCommitteeStats(params: { fromDate: string; toDate: string }) {
  const { fromDate, toDate } = params;

  const stats = await db
    .select({
      committee: nabhCommitteeReports.committee,
      count: sql<number>`count(*)::int`,
      lastMeeting: sql<string>`MAX(meeting_date)`,
    })
    .from(nabhCommitteeReports)
    .where(
      and(
        gte(nabhCommitteeReports.meetingDate, fromDate),
        lte(nabhCommitteeReports.meetingDate, toDate),
      ),
    )
    .groupBy(nabhCommitteeReports.committee);

  return stats;
}
