import { COMPLIANCE_STANDARDS, type ComplianceStandard } from "./standards";

export interface ComplianceEvidence {
  standard: ComplianceStandard;
  evidence: string;
  location: string;
  status: "implemented" | "partial" | "missing";
  lastVerified: string;
}

export interface CertificationReport {
  certification: string;
  generatedAt: string;
  summary: {
    total: number;
    implemented: number;
    partial: number;
    missing: number;
    percentage: number;
  };
  byCategory: Record<string, { total: number; implemented: number; partial: number; missing: number }>;
  details: ComplianceEvidence[];
}

export function generateCertificationReport(certification: string = "MeitY/STQC EMR"): CertificationReport {
  const standards = COMPLIANCE_STANDARDS;
  const details: ComplianceEvidence[] = standards.map((s) => ({
    standard: s,
    evidence: s.implemented
      ? s.evidenceKey
      : "Not available — see notes for requirements",
    location: s.evidenceKey,
    status: s.implemented ? "implemented" : "missing",
    lastVerified: new Date().toISOString(),
  }));

  const implemented = details.filter((d) => d.status === "implemented").length;
  const partial = details.filter((d) => d.status === "partial").length;
  const missing = details.filter((d) => d.status === "missing").length;
  const total = standards.length;

  const byCategory: Record<string, { total: number; implemented: number; partial: number; missing: number }> = {};
  for (const d of details) {
    const cat = d.standard.category;
    if (!byCategory[cat]) byCategory[cat] = { total: 0, implemented: 0, partial: 0, missing: 0 };
    byCategory[cat].total++;
    byCategory[cat][d.status]++;
  }

  return {
    certification,
    generatedAt: new Date().toISOString(),
    summary: {
      total,
      implemented,
      partial,
      missing,
      percentage: total > 0 ? Number(((implemented / total) * 100).toFixed(1)) : 0,
    },
    byCategory,
    details,
  };
}

export function generateGapAnalysis(): {
  certification: string;
  gapItems: { standard: ComplianceStandard; requirement: string; actionItem: string; priority: "high" | "medium" | "low" }[];
} {
  const missing = COMPLIANCE_STANDARDS.filter((s) => !s.implemented);
  return {
    certification: "MeitY/STQC EMR",
    gapItems: missing.map((s) => ({
      standard: s,
      requirement: s.requirement,
      actionItem: s.notes || `Implement ${s.name} — ${s.description}`,
      priority: s.category === "privacy_security" || s.category === "backup_recovery" ? "high" : "medium",
    })),
  };
}

export function getComplianceByCategory(): Record<string, ComplianceStandard[]> {
  const grouped: Record<string, ComplianceStandard[]> = {};
  for (const s of COMPLIANCE_STANDARDS) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }
  return grouped;
}
