import { db } from "../db";
import { nabhRegisters, encounters, patients } from "../db/schema";
import { and, eq, gte, lte, sql, desc } from "drizzle-orm";

export interface RegisterEntry {
  type: "birth" | "death" | "notifiable_disease" | "pcpndt";
  patientId?: string;
  encounterId?: string;
  patientName?: string;
  recordedBy: string;
  details: Record<string, unknown>;
  notifiedTo?: string;
  notificationDate?: string;
}

export async function createRegisterEntry(entry: RegisterEntry): Promise<typeof nabhRegisters.$inferSelect> {
  const id = `REG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const registerNumber = `${entry.type.toUpperCase().slice(0, 3)}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const [result] = await db
    .insert(nabhRegisters)
    .values({
      id,
      type: entry.type,
      patientId: entry.patientId,
      encounterId: entry.encounterId,
      patientName: entry.patientName,
      recordedBy: entry.recordedBy,
      details: entry.details as Record<string, unknown>,
      registerNumber,
      notifiedTo: entry.notifiedTo,
      notificationDate: entry.notificationDate || null,
    })
    .returning();

  return result;
}

export async function queryRegisters(params: {
  type?: string;
  patientId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}) {
  const { type, patientId, fromDate, toDate, page = 1, limit = 50 } = params;
  const conditions = [];

  if (type) conditions.push(eq(nabhRegisters.type, type));
  if (patientId) conditions.push(eq(nabhRegisters.patientId, patientId));
  if (fromDate) conditions.push(gte(nabhRegisters.recordedAt, new Date(fromDate)));
  if (toDate) conditions.push(lte(nabhRegisters.recordedAt, new Date(toDate)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [total, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(nabhRegisters).where(where),
    db
      .select()
      .from(nabhRegisters)
      .where(where)
      .orderBy(desc(nabhRegisters.recordedAt))
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

export async function getRegisterStats(params: { fromDate: string; toDate: string }) {
  const { fromDate, toDate } = params;

  const stats = await db
    .select({
      type: nabhRegisters.type,
      count: sql<number>`count(*)::int`,
    })
    .from(nabhRegisters)
    .where(
      and(
        gte(nabhRegisters.recordedAt, new Date(fromDate)),
        lte(nabhRegisters.recordedAt, new Date(toDate)),
      ),
    )
    .groupBy(nabhRegisters.type);

  return stats;
}

export async function getRegisterById(id: string) {
  return db.query.nabhRegisters.findFirst({
    where: eq(nabhRegisters.id, id),
  });
}
