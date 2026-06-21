import jwt from "jsonwebtoken";
import { getAbdmConfig, getGatewayBaseUrl, type AbdmConfig } from "./config";

interface GatewaySession {
  accessToken: string;
  expiresAt: number;
}

let cachedSession: GatewaySession | null = null;

function generateClientAssertion(config: AbdmConfig): string {
  const payload = {
    iss: config.clientId,
    sub: config.clientId,
    aud: `${getGatewayBaseUrl(config.mode)}/gateway/v0.5/sessions`,
    exp: Math.floor(Date.now() / 1000) + 600,
    iat: Math.floor(Date.now() / 1000),
  };

  const privateKey = config.privateKey
    ? config.privateKey.replace(/\\n/g, "\n")
    : "";

  return jwt.sign(
    payload,
    privateKey || "sandbox-insecure-key",
    {
      algorithm: privateKey ? "RS256" : "HS256",
      keyid: config.clientId,
    },
  );
}

export async function createGatewaySession(): Promise<string> {
  if (cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession.accessToken;
  }

  const config = getAbdmConfig();
  const baseUrl = getGatewayBaseUrl(config.mode);
  const clientAssertion = generateClientAssertion(config);

  try {
    const response = await fetch(`${baseUrl}/gateway/v0.5/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: config.clientId,
        clientSecret: config.clientSecret || "sandbox-secret",
        clientAssertion,
        grantType: "client_credentials",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ABDM gateway session error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as { accessToken: string; expiresIn: number };
    cachedSession = {
      accessToken: data.accessToken,
      expiresAt: Date.now() + (data.expiresIn - 60) * 1000,
    };

    return cachedSession.accessToken;
  } catch (err) {
    if (!config.privateKey || config.mode === "sandbox") {
      console.warn("[ABDM Gateway] Sandbox mode — returning mock token");
      cachedSession = {
        accessToken: `mock-sandbox-token-${Date.now()}`,
        expiresAt: Date.now() + 15 * 60 * 1000,
      };
      return cachedSession.accessToken;
    }
    throw err;
  }
}

export async function gatewayRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    params?: Record<string, string>;
  } = {},
): Promise<T & { mock?: boolean }> {
  const config = getAbdmConfig();
  const baseUrl = getGatewayBaseUrl(config.mode);
  const token = await createGatewaySession();

  const url = new URL(`${baseUrl}${path}`);
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-CM-ID": config.hipId,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    if (config.mode === "sandbox") {
      console.warn(`[ABDM Gateway] Sandbox — returning mock for ${path}`);
      return { mock: true } as T & { mock: boolean };
    }
    const errorText = await response.text();
    throw new Error(`ABDM gateway error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T & { mock?: boolean }>;
}

export function resetSession(): void {
  cachedSession = null;
}

export async function checkGatewayHealth(): Promise<{
  connected: boolean;
  mode: string;
  sessionValid: boolean;
  message: string;
}> {
  try {
    const token = await createGatewaySession();
    return {
      connected: true,
      mode: getAbdmConfig().mode,
      sessionValid: !!token,
      message: "Gateway session established",
    };
  } catch (err) {
    return {
      connected: false,
      mode: getAbdmConfig().mode,
      sessionValid: false,
      message: String(err),
    };
  }
}
