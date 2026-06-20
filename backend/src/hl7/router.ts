import { createServer, Server, Socket } from "net";
import { parseHL7Message, ParsedHL7Message } from "./parser";
import { generateAck } from "./generator";

const SB = 0x0B;
const EB = 0x1C;
const CR = 0x0D;

const handlers: Map<string, (msg: ParsedHL7Message) => Promise<string>> = new Map();

export function registerHandler(messageType: string, handler: (msg: ParsedHL7Message) => Promise<string>): void {
  handlers.set(messageType, handler);
}

let server: Server | null = null;

export function startMllpServer(port = 2575): void {
  if (server) return;

  server = createServer((socket: Socket) => {
    let buffer = Buffer.alloc(0);

    socket.on("data", (data: Buffer) => {
      buffer = Buffer.concat([buffer, data]);

      while (buffer.length >= 3) {
        const ebIdx = buffer.indexOf(EB);
        if (ebIdx === -1) break;

        if (ebIdx === 0 || buffer[0] !== SB) {
          buffer = buffer.slice(1);
          continue;
        }

        const messageBuf = buffer.subarray(1, ebIdx);
        const rest = buffer.subarray(ebIdx + 2);

        buffer = Buffer.alloc(0);
        if (rest.length > 0) {
          buffer = Buffer.concat([buffer, rest]);
        }

        const rawMessage = messageBuf.toString("utf-8");
        handleMessage(socket, rawMessage);
      }
    });

    socket.on("error", (err) => {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        source: "hl7",
        error: err.message,
      }));
    });
  });

  server.listen(port, () => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      message: `MLLP server listening on port ${port}`,
      port,
    }));
  });

  server.on("error", (err) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      source: "hl7",
      error: `MLLP server error: ${err.message}`,
    }));
  });
}

async function handleMessage(socket: Socket, rawMessage: string): Promise<void> {
  let parsed: ParsedHL7Message;
  let ackRaw: string;

  try {
    parsed = parseHL7Message(rawMessage);
    const responseMessage = await routeMessage(parsed);
    ackRaw = generateAck(parsed, responseMessage === "ACK" ? "AA" : "AE");
  } catch (err) {
    const fallback = rawMessage.includes("MSH") ? parseHL7Message(rawMessage.split("\r")[0] + "\r") : null;
    if (fallback) {
      ackRaw = generateAck(fallback, "AR");
    } else {
      ackRaw = "";
    }
  }

  const response = Buffer.concat([
    Buffer.from([SB]),
    Buffer.from(ackRaw, "utf-8"),
    Buffer.from([EB, CR]),
  ]);

  try {
    socket.write(response);
  } catch (err) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      source: "hl7",
      error: "Failed to send ACK",
    }));
  }
}

export async function routeMessage(parsedMessage: ParsedHL7Message): Promise<string> {
  const msgType = parsedMessage.msh.messageType;
  const handler = handlers.get(msgType);

  if (handler) {
    return handler(parsedMessage);
  }

  if (msgType === "ADT" || msgType === "ORM" || msgType === "ORU") {
    return "ACK";
  }

  return "ACK";
}

export function stopMllpServer(): void {
  if (server) {
    server.close();
    server = null;
  }
}
