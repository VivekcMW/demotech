import { db, schema } from "../db";

export async function sendOrderToRIS(order: Record<string, any>): Promise<string> {
  const logId = `RIS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const start = Date.now();

  try {
    const now = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const msh = [
      "MSH|^~\\&|AAROGYAEHR|AAROGYAEHR|RIS|RIS|" + now + "||ORM^O01|" + logId + "|P|2.5",
    ];
    const pid = [
      "PID|||" + (order.patientId || "PATIENT1"),
      "||" + (order.patientName || "") + "||" + (order.dob || "") + "|" + (order.gender || ""),
    ].join("");
    const orc = ["ORC|NW|" + (order.orderId || logId)];
    const obr = [
      "OBR|1|" + (order.orderId || logId) + "||" + (order.procedureCode || "IMG001") + "^" + (order.procedureName || "Radiology"),
    ];

    const message = [...msh, pid, ...orc, ...obr].join("\r") + "\r";

    await db.insert(schema.fhirIntegrationLog).values({
      id: logId,
      source: "hl7",
      direction: "outbound",
      messageType: "ORM^O01",
      resourceType: "ImagingStudy",
      resourceId: order.orderId,
      status: "success",
      requestBody: message,
      durationMs: Date.now() - start,
      createdAt: new Date(),
    });

    return logId;
  } catch (err) {
    await db.insert(schema.fhirIntegrationLog).values({
      id: logId,
      source: "hl7",
      direction: "outbound",
      messageType: "ORM^O01",
      resourceType: "ImagingStudy",
      resourceId: order.orderId,
      status: "error",
      errorMessage: String(err),
      durationMs: Date.now() - start,
      createdAt: new Date(),
    });
    throw err;
  }
}

export async function receiveResultsFromRIS(): Promise<Record<string, any>[]> {
  return [];
}

export function mapResultToDiagnosticReport(result: Record<string, any>): Record<string, any> {
  return {
    resourceType: "DiagnosticReport",
    status: "final",
    code: {
      coding: [{ system: "http://loinc.org", code: result.procedureCode || "UNKNOWN", display: result.procedureName || "Unknown Procedure" }],
      text: result.procedureName || "Radiology Report",
    },
    conclusion: result.conclusion || result.impression || result.report || "",
    issued: new Date().toISOString(),
  };
}
