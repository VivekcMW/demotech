export type ZPDSegment = {
  religion?: string;
  motherTongue?: string;
  caste?: string;
  maritalStatus?: string;
  educationLevel?: string;
  incomeGroup?: string;
  aadhaarHash?: string;
};

export type ZPVSegment = {
  insuranceCoverage?: string;
  schemeCode?: string;
  referralType?: string;
  billingCategory?: string;
};

function esc(val: string): string {
  return val
    .replace(/\\/g, "\\E\\")
    .replace(/\|/g, "\\F\\")
    .replace(/\^/g, "\\S\\")
    .replace(/&/g, "\\T\\")
    .replace(/~/g, "\\R\\");
}

export function parseZPD(fields: string[][]): ZPDSegment {
  return {
    religion: fields[1]?.[0] || undefined,
    motherTongue: fields[2]?.[0] || undefined,
    caste: fields[3]?.[0] || undefined,
    maritalStatus: fields[4]?.[0] || undefined,
    educationLevel: fields[5]?.[0] || undefined,
    incomeGroup: fields[6]?.[0] || undefined,
    aadhaarHash: fields[7]?.[0] || undefined,
  };
}

export function parseZPV(fields: string[][]): ZPVSegment {
  return {
    insuranceCoverage: fields[1]?.[0] || undefined,
    schemeCode: fields[2]?.[0] || undefined,
    referralType: fields[3]?.[0] || undefined,
    billingCategory: fields[4]?.[0] || undefined,
  };
}

export function generateZPD(data: ZPDSegment): string {
  const f = (v: string | undefined) => (v ? esc(v) : "");
  return [
    "ZPD",
    "",
    f(data.religion),
    f(data.motherTongue),
    f(data.caste),
    f(data.maritalStatus),
    f(data.educationLevel),
    f(data.incomeGroup),
    f(data.aadhaarHash),
  ].join("|");
}

export function generateZPV(data: ZPVSegment): string {
  const f = (v: string | undefined) => (v ? esc(v) : "");
  return [
    "ZPV",
    "",
    f(data.insuranceCoverage),
    f(data.schemeCode),
    f(data.referralType),
    f(data.billingCategory),
  ].join("|");
}
