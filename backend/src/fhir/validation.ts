const ISO8601_REGEX = /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?)?)?$/;
const REFERENCE_REGEX = /^[A-Z][A-Za-z]+\/[A-Za-z0-9\-.\u00C0-\uFFFF]{1,64}$/;

export interface OperationOutcomeIssue {
  severity: "fatal" | "error" | "warning" | "information";
  code: string;
  details: { text: string };
  expression?: string[];
}

export interface OperationOutcome {
  resourceType: "OperationOutcome";
  issue: OperationOutcomeIssue[];
}

function issue(
  severity: OperationOutcomeIssue["severity"],
  code: string,
  details: string,
  expression?: string[],
): OperationOutcomeIssue {
  return { severity, code, details: { text: details }, expression };
}

function errorOutcome(issues: OperationOutcomeIssue[]): OperationOutcome {
  return { resourceType: "OperationOutcome", issue: issues };
}

const REQUIRED_FIELDS: Record<string, string[]> = {
  Patient: ["name", "gender"],
  Observation: ["code", "status"],
  Encounter: ["status", "class"],
  Condition: ["subject", "code", "clinicalStatus"],
  MedicationRequest: ["subject", "medication", "status", "intent"],
  DiagnosticReport: ["status", "code", "subject"],
  ImagingStudy: ["subject"],
  Subscription: ["status", "reason", "criteria", "channel"],
};

export function validateResource(resourceType: string, resource: any): OperationOutcome | null {
  if (!resource || typeof resource !== "object") {
    return errorOutcome([issue("error", "invalid", `Resource must be an object`)]);
  }

  const issues: OperationOutcomeIssue[] = [];

  if (resource.resourceType && resource.resourceType !== resourceType) {
    issues.push(issue("error", "invalid", `resourceType mismatch: expected ${resourceType}, got ${resource.resourceType}`, ["resourceType"]));
  }

  const required = REQUIRED_FIELDS[resourceType];
  if (required) {
    for (const field of required) {
      const value = field.includes(".") ? field.split(".").reduce((o, k) => o?.[k], resource) : resource[field];
      if (value === undefined || value === null || value === "") {
        issues.push(issue("error", "required", `Missing required field "${field}" for ${resourceType}`, [field]));
      }
    }
  }

  if (issues.length > 0) return errorOutcome(issues);

  if (resourceType === "Patient" && resource.name) {
    const names = Array.isArray(resource.name) ? resource.name : [resource.name];
    for (const n of names) {
      if (!n.text && !n.given && !n.family) {
        issues.push(issue("warning", "invalid", "Patient name should have text, given, or family", ["name"]));
      }
    }
  }

  if (resourceType === "Observation" && resource.code) {
    validateCodings(resource.code, issues);
  }

  if (resourceType === "Condition" && resource.code) {
    validateCodings(resource.code, issues);
  }

  if (resource.subject) {
    const ref = typeof resource.subject === "string" ? resource.subject : resource.subject.reference;
    if (ref && !REFERENCE_REGEX.test(ref)) {
      issues.push(issue("error", "invalid", `Invalid reference format "${ref}". Expected resourceType/id`, ["subject"]));
    }
  }

  if (resourceType === "Subscription" && resource.channel) {
    if (!resource.channel.type) {
      issues.push(issue("error", "required", "Subscription.channel.type is required", ["channel.type"]));
    }
    if (!resource.channel.endpoint) {
      issues.push(issue("error", "required", "Subscription.channel.endpoint is required", ["channel.endpoint"]));
    }
  }

  validateDates(resource, issues);

  return issues.length > 0 ? errorOutcome(issues) : null;
}

function validateCodings(codeField: any, issues: OperationOutcomeIssue[]) {
  const codings = codeField.coding || (Array.isArray(codeField) ? codeField : [codeField]);
  for (const c of codings) {
    if (c.system && !c.code) {
      issues.push(issue("warning", "invalid", "Coding has system but missing code", []));
    }
  }
}

function validateDates(resource: any, issues: OperationOutcomeIssue[]) {
  const dateFields = ["birthDate", "occurrenceDateTime", "recordedDate", "authoredOn", "effectiveDateTime", "period.start", "period.end", "issued"];
  for (const field of dateFields) {
    const value = field.includes(".") ? field.split(".").reduce((o, k) => o?.[k], resource) : resource[field];
    if (value && typeof value === "string" && !ISO8601_REGEX.test(value)) {
      issues.push(issue("warning", "invalid", `Field "${field}" is not a valid ISO 8601 date: "${value}"`, [field]));
    }
  }
}
