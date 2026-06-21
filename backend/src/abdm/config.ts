export interface AbdmConfig {
  mode: "sandbox" | "production";
  clientId: string;
  clientSecret: string;
  privateKey: string;
  publicKeyUrl: string;
  hipId: string;
  hipName: string;
  callbackBaseUrl: string;
}

const defaults: Partial<AbdmConfig> = {
  mode: "sandbox",
  clientId: "aarogya-ehr-sandbox",
  clientSecret: "",
  privateKey: "",
  publicKeyUrl: "https://sandbox.abdm.gov.in/api/v1/certificate",
  hipId: "HIP-100001",
  hipName: "AarogyaEHR",
  callbackBaseUrl: process.env.ABDM_CALLBACK_URL || "https://localhost:4000/api/v1/abdm",
};

export function getAbdmConfig(): AbdmConfig {
  return {
    mode: (process.env.ABDM_MODE as "sandbox" | "production") || "sandbox",
    clientId: process.env.ABDM_CLIENT_ID || defaults.clientId!,
    clientSecret: process.env.ABDM_CLIENT_SECRET || "",
    privateKey: process.env.ABDM_PRIVATE_KEY || "",
    publicKeyUrl: process.env.ABDM_PUBLIC_KEY_URL || defaults.publicKeyUrl!,
    hipId: process.env.ABDM_HIP_ID || defaults.hipId!,
    hipName: process.env.ABDM_HIP_NAME || defaults.hipName!,
    callbackBaseUrl: process.env.ABDM_CALLBACK_URL || defaults.callbackBaseUrl!,
  };
}

export function getGatewayBaseUrl(mode: "sandbox" | "production"): string {
  return mode === "sandbox"
    ? "https://sandbox.abdm.gov.in"
    : "https://abdm.gov.in";
}
