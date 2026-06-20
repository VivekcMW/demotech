import { ParsedHL7Message } from "./parser";

function esc(val: string): string {
  return String(val ?? "")
    .replace(/\\/g, "\\E\\")
    .replace(/\|/g, "\\F\\")
    .replace(/\^/g, "\\S\\")
    .replace(/&/g, "\\T\\")
    .replace(/~/g, "\\R\\");
}

function msh(sendingApp: string, sendingFacility: string, msgType: string, trigger: string, version = "2.5"): string {
  const dt = new Date();
  const ts = dt.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const ctrlId = `MSG${dt.getTime()}`;
  return [
    "MSH",
    "^~\\&",
    esc(sendingApp),
    esc(sendingFacility),
    "AAROGYAEHR",
    "AAROGYAEHR",
    ts,
    "",
    `${esc(msgType)}^${esc(trigger)}`,
    ctrlId,
    "P",
    version,
  ].join("|");
}

function pid(patient: Record<string, any>): string {
  const name = patient.name || "";
  const [last = "", first = "", middle = ""] = typeof name === "string" ? name.split("^") : [name.family || "", name.given?.[0] || "", name.given?.[1] || ""];
  return [
    "PID",
    "1",
    esc(patient.id || patient.patientId || ""),
    "",
    `${esc(last)}^${esc(first)}^${esc(middle)}`,
    esc(patient.dob || patient.birthDate || ""),
    esc(patient.gender || patient.gender || ""),
    "",
    "",
    esc(patient.address?.toString() || patient.address || ""),
    "",
    "",
    esc(patient.phone || patient.mobile || ""),
    "",
    "",
    "",
    "",
    "",
    esc(patient.aadhaarHash || ""),
  ].join("|");
}

function pv1(encounter: Record<string, any>): string {
  return [
    "PV1",
    "1",
    esc(encounter.class || encounter.patientClass || "O"),
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    esc(encounter.id || encounter.encounterId || ""),
  ].join("|");
}

function orc(order: Record<string, any>): string {
  return [
    "ORC",
    esc(order.orcStatus || "NW"),
    esc(order.id || order.orderId || ""),
    "",
    "",
    "",
    "",
    "",
    "",
    esc(order.orderDateTime || ""),
    "",
    "",
    "",
    esc(order.orderingProvider || ""),
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ].join("|");
}

function obr(order: Record<string, any>): string {
  return [
    "OBR",
    "1",
    esc(order.id || order.orderId || ""),
    "",
    `${esc(order.testCode || order.serviceId || "")}^${esc(order.testName || "")}`,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ].join("|");
}

function obx(observation: Record<string, any>): string {
  return [
    "OBX",
    "1",
    esc(observation.valueType || "ST"),
    `${esc(observation.code || observation.testCode || "")}^${esc(observation.name || "")}`,
    "",
    esc(String(observation.value ?? observation.result ?? "")),
    esc(observation.unit || ""),
    esc(observation.referenceRange || ""),
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ].join("|");
}

function generateMessage(segments: string[]): string {
  return segments.join("\r") + "\r";
}

export function generateAdmitMessage(patient: Record<string, any>, encounter: Record<string, any>): string {
  return generateMessage([
    msh("AAROGYAEHR", "AAROGYAEHR", "ADT", "A01"),
    pid(patient),
    pv1(encounter),
  ]);
}

export function generateDischargeMessage(patient: Record<string, any>, encounter: Record<string, any>): string {
  return generateMessage([
    msh("AAROGYAEHR", "AAROGYAEHR", "ADT", "A03"),
    pid(patient),
    pv1(encounter),
  ]);
}

export function generateRegisterMessage(patient: Record<string, any>): string {
  return generateMessage([
    msh("AAROGYAEHR", "AAROGYAEHR", "ADT", "A04"),
    pid(patient),
  ]);
}

export function generateUpdateMessage(patient: Record<string, any>): string {
  return generateMessage([
    msh("AAROGYAEHR", "AAROGYAEHR", "ADT", "A08"),
    pid(patient),
  ]);
}

export function generateOrderMessage(order: Record<string, any>, patient: Record<string, any>): string {
  return generateMessage([
    msh("AAROGYAEHR", "AAROGYAEHR", "ORM", "O01"),
    pid(patient),
    orc(order),
    obr(order),
  ]);
}

export function generateResultMessage(observation: Record<string, any>, patient: Record<string, any>): string {
  return generateMessage([
    msh("AAROGYAEHR", "AAROGYAEHR", "ORU", "R01"),
    pid(patient),
    obx(observation),
  ]);
}

export function generateAck(originalMessage: ParsedHL7Message, ackCode: string): string {
  const msh = originalMessage.msh;
  const dt = new Date();
  const ts = dt.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const ctrlId = `ACK${dt.getTime()}`;
  const msa = [
    "MSA",
    esc(ackCode || "AA"),
    esc(msh.messageControlId),
    "",
  ].join("|");

  const ackMsh = [
    "MSH",
    "^~\\&",
    "AAROGYAEHR",
    "AAROGYAEHR",
    esc(msh.sendingApp),
    esc(msh.sendingFacility),
    ts,
    "",
    "ACK",
    ctrlId,
    "P",
    esc(msh.versionId || "2.5"),
  ].join("|");

  return generateMessage([ackMsh, msa]);
}

export { esc };
