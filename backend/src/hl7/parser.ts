export type ParsedHL7Message = {
  segments: {
    type: string;
    fields: string[][][];
    raw: string;
  }[];
  msh: {
    sendingApp: string;
    sendingFacility: string;
    receivingApp: string;
    receivingFacility: string;
    messageDateTime: string;
    messageType: string;
    triggerEvent: string;
    messageControlId: string;
    versionId: string;
  };
};

const escapeMap: Record<string, string> = {
  "\\F\\": "|",
  "\\S\\": "^",
  "\\T\\": "&",
  "\\R\\": "~",
  "\\E\\": "\\",
  "\\X0A\\": "\n",
  "\\X0D\\": "\r",
};

function decodeHL7(value: string): string {
  let result = value;
  for (const [code, char] of Object.entries(escapeMap)) {
    result = result.split(code).join(char);
  }
  return result.replace(/\\([A-F0-9]{4})\\/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function encodeHL7(value: string): string {
  return value
    .replace(/\\/g, "\\E\\")
    .replace(/\|/g, "\\F\\")
    .replace(/\^/g, "\\S\\")
    .replace(/&/g, "\\T\\")
    .replace(/~/g, "\\R\\");
}

function splitFields(line: string, fieldSep: string): string[] {
  const fields = [""];
  let i = 0;
  for (const ch of line) {
    if (ch === fieldSep) {
      fields.push("");
      i++;
    } else {
      fields[i] += ch;
    }
  }
  return fields.map(decodeHL7);
}

function splitComponents(field: string): string[] {
  if (!field) return [""];
  const parts = [""];
  let i = 0;
  for (const ch of field) {
    if (ch === "^") {
      parts.push("");
      i++;
    } else {
      parts[i] += ch;
    }
  }
  return parts;
}

function splitSubComponents(component: string): string[] {
  if (!component) return [""];
  const parts = [""];
  let i = 0;
  for (const ch of component) {
    if (ch === "&") {
      parts.push("");
      i++;
    } else {
      parts[i] += ch;
    }
  }
  return parts;
}

function splitRepeats(field: string): string[] {
  if (!field) return [""];
  const parts = [""];
  let i = 0;
  for (const ch of field) {
    if (ch === "~") {
      parts.push("");
      i++;
    } else {
      parts[i] += ch;
    }
  }
  return parts;
}

function parseSegmentField(field: string): string[][] {
  const repeats = splitRepeats(field);
  return repeats.map((repeat) => {
    const components = splitComponents(repeat);
    return components.map(splitSubComponents).map((sc) => sc[0]);
  });
}

export function parseHL7Message(rawMessage: string): ParsedHL7Message {
  const lines = rawMessage.replace(/\r\n?/g, "\n").split("\n").filter(Boolean);
  const segments = lines.map((line) => {
    const fieldSep = line.length > 3 ? line[3] : "|";
    const rawFields = splitFields(line, fieldSep);
    const type = rawFields[0] || "";
    const fields = rawFields.map((f) => {
      const repeats = splitRepeats(f);
      return repeats.map((repeat) => {
        const components = splitComponents(repeat);
        return components.map(splitSubComponents).map((sc) => sc[0]);
      });
    });
    return { type, fields, raw: line };
  });

  const mshSegment = segments.find((s) => s.type === "MSH");
  if (!mshSegment) {
    throw new Error("No MSH segment found in HL7 message");
  }

  const f = mshSegment.fields;
  const versionId = f[12]?.[0]?.[0] || "";
  const messageType = f[9]?.[0]?.[0] || "";
  const [msgType = "", triggerEvent = ""] = messageType.split("^");

  return {
    segments,
    msh: {
      sendingApp: f[2]?.[0]?.[0] || "",
      sendingFacility: f[3]?.[0]?.[0] || "",
      receivingApp: f[4]?.[0]?.[0] || "",
      receivingFacility: f[5]?.[0]?.[0] || "",
      messageDateTime: f[6]?.[0]?.[0] || "",
      messageType: msgType,
      triggerEvent: triggerEvent,
      messageControlId: f[10]?.[0]?.[0] || "",
      versionId,
    },
  };
}

export function messageType(parsed: ParsedHL7Message): string {
  return `${parsed.msh.messageType}^${parsed.msh.triggerEvent}`;
}

export function toJSON(parsed: ParsedHL7Message): object {
  const result: Record<string, unknown> = {
    msh: parsed.msh,
    segments: parsed.segments.map((seg) => ({
      type: seg.type,
      fields: seg.fields,
    })),
  };
  for (const seg of parsed.segments) {
    if (seg.type !== "MSH") {
      const key = seg.type.toLowerCase();
      if (!result[key]) {
        result[key] = [];
      }
      (result[key] as unknown[]).push(seg.fields);
    }
  }
  return result;
}

export { decodeHL7, encodeHL7, splitFields, splitComponents, splitSubComponents, splitRepeats, parseSegmentField };
