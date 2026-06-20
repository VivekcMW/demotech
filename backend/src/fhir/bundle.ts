export interface FHIRBundleLink {
  relation: string;
  url: string;
}

export interface BundleEntry {
  fullUrl?: string;
  resource?: any;
  request?: {
    method: string;
    url: string;
  };
  response?: {
    status: string;
    location?: string;
    etag?: string;
    lastModified?: string;
  };
  search?: {
    mode: "match" | "include" | "outcome";
  };
}

export interface FHIRBundle {
  resourceType: "Bundle";
  type: string;
  id?: string;
  meta?: { lastUpdated: string };
  timestamp?: string;
  total?: number;
  link?: FHIRBundleLink[];
  entry?: BundleEntry[];
}

export interface OperationOutcome {
  resourceType: "OperationOutcome";
  issue: Array<{
    severity: "fatal" | "error" | "warning" | "information";
    code: string;
    details: { text: string };
    expression?: string[];
  }>;
}

export function buildBundle(
  type: string,
  entries: BundleEntry[],
  total: number,
  baseUrl?: string,
  selfLink?: string,
): FHIRBundle {
  const bundle: FHIRBundle = {
    resourceType: "Bundle",
    type,
    id: crypto.randomUUID(),
    meta: { lastUpdated: new Date().toISOString() },
    timestamp: new Date().toISOString(),
    total,
    entry: entries,
  };

  const links: FHIRBundleLink[] = [];
  if (selfLink) {
    links.push({ relation: "self", url: selfLink });
  }
  if (baseUrl) {
    links.push({ relation: "fhir-base", url: baseUrl });
  }
  if (links.length > 0) {
    bundle.link = links;
  }

  return bundle;
}

export function buildOperationOutcome(
  severity: "fatal" | "error" | "warning" | "information",
  code: string,
  details: string,
  expression?: string[],
): OperationOutcome {
  return {
    resourceType: "OperationOutcome",
    issue: [{ severity, code, details: { text: details }, ...(expression ? { expression } : {}) }],
  };
}

export function addIncludedResources(
  bundle: FHIRBundle,
  included: BundleEntry[],
  revIncluded: BundleEntry[],
): FHIRBundle {
  if (!bundle.entry) bundle.entry = [];

  for (const entry of included) {
    bundle.entry.push({
      ...entry,
      search: { mode: "include" },
    });
  }

  for (const entry of revIncluded) {
    bundle.entry.push({
      ...entry,
      search: { mode: "include" },
    });
  }

  return bundle;
}
