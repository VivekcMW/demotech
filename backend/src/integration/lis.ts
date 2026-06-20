import { db, schema } from "../db";

export type FhirEndpoint = {
  id: string;
  host: string;
  port: number;
  path?: string;
  settings?: Record<string, unknown>;
};

export async function connectToAnalyzer(endpoint: FhirEndpoint): Promise<boolean> {
  try {
    const logId = `LIS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const start = Date.now();
    let success = false;

    try {
      const socket = new (await import("net")).Socket();
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          socket.destroy();
          reject(new Error("Connection timeout"));
        }, 5000);

        socket.connect(endpoint.port, endpoint.host, () => {
          clearTimeout(timeout);
          success = true;
          socket.destroy();
          resolve();
        });

        socket.on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    } catch {
      success = false;
    }

    await db.insert(schema.fhirIntegrationLog).values({
      id: logId,
      source: "hl7",
      direction: "outbound",
      messageType: "LIS_CONNECT",
      status: success ? "success" : "error",
      errorMessage: success ? undefined : `Failed to connect to ${endpoint.host}:${endpoint.port}`,
      durationMs: Date.now() - start,
      createdAt: new Date(),
    });

    return success;
  } catch {
    return false;
  }
}

export async function sendTestOrder(order: Record<string, any>): Promise<string> {
  const logId = `LIS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const start = Date.now();

  try {
    // Build a simple HL7 ORM message
    const now = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const msh = [
      "MSH|^~\\&|AAROGYAEHR|AAROGYAEHR|LIS|LIS|" + now + "||ORM^O01|" + logId + "|P|2.5",
    ];
    const pid = [
      "PID|||" + (order.patientId || "PATIENT1"),
      "||" + (order.patientName || "") + "||" + (order.dob || "") + "|" + (order.gender || ""),
    ].join("");
    const orc = ["ORC|NW|" + (order.orderId || logId)];
    const obr = ["OBR|1|" + (order.orderId || logId) + "||" + (order.testCode || "TEST001") + "^" + (order.testName || "Test")];

    const message = [...msh, pid, ...orc, ...obr].join("\r") + "\r";

    await db.insert(schema.fhirIntegrationLog).values({
      id: logId,
      source: "hl7",
      direction: "outbound",
      messageType: "ORM^O01",
      resourceType: "LabOrder",
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
      resourceType: "LabOrder",
      resourceId: order.orderId,
      status: "error",
      errorMessage: String(err),
      durationMs: Date.now() - start,
      createdAt: new Date(),
    });
    throw err;
  }
}

export async function receiveResults(): Promise<Record<string, any>[]> {
  return [];
}

export function parseAstmMessage(raw: string): Record<string, any> {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n").filter(Boolean);
  const result: Record<string, any> = {
    raw,
    records: [],
  };

  for (const line of lines) {
    const fields = line.split("|");
    const type = fields[0]?.trim() || "";
    result.records.push({ type, fields: fields.slice(1) });

    if (type === "R" && fields.length >= 4) {
      result.testCode = fields[2]?.trim();
      result.testName = fields[3]?.trim();
    }
    if (type === "C" && fields.length >= 3) {
      result.value = fields[2]?.trim();
      result.unit = fields.length > 3 ? fields[3]?.trim() : undefined;
    }
  }

  return result;
}

export function mapResultToObservation(result: Record<string, any>): Record<string, any> {
  return {
    resourceType: "Observation",
    status: "final",
    code: {
      coding: [{ system: "http://loinc.org", code: result.testCode || "UNKNOWN", display: result.testName || "Unknown Test" }],
      text: result.testName || "Unknown Test",
    },
    valueString: result.value,
    valueQuantity: result.value && result.unit
      ? { value: parseFloat(result.value), unit: result.unit }
      : undefined,
    issued: new Date().toISOString(),
  };
}
