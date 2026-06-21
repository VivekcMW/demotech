import { gatewayRequest } from "./gateway";

export interface AbhaCreateResponse {
  success: boolean;
  txnId?: string;
  abhaId?: string;
  abhaNumber?: string;
  token?: string;
  error?: string;
}

export interface AbhaProfile {
  abhaId: string;
  abhaNumber: string;
  name: string;
  gender: string;
  dob: string;
  mobile: string;
  email?: string;
  address?: string;
  state?: string;
  district?: string;
  pincode?: string;
}

export interface AbhaSearchResult {
  abhaId: string;
  abhaNumber: string;
  name: string;
  gender: string;
  dob: string;
  mobile: string;
}

// ── ABHA via Aadhaar OTP ────────────────────────────────────────────────

export async function generateAbhaViaAadhaar(aadhaar: string, txnId: string): Promise<AbhaCreateResponse> {
  try {
    const result = await gatewayRequest<AbhaCreateResponse>("/gateway/v0.5/patients/registration", {
      method: "POST",
      body: { aadhaar, txnId, consent: true },
    });
    if (result.mock) throw new Error("fallback to sandbox mock");
    return result;
  } catch {
    console.warn("[ABDM Mock] generateAbhaViaAadhaar");
    return {
      success: true,
      txnId,
      abhaId: `mock-abha-${Date.now()}`,
      abhaNumber: `91-${Date.now().toString().slice(-10)}`,
      token: `mock-token-${Date.now()}`,
    };
  }
}

export async function verifyAadhaarOtp(txnId: string, otp: string): Promise<AbhaCreateResponse> {
  try {
    const result = await gatewayRequest<AbhaCreateResponse>("/gateway/v0.5/patients/registration/verify-otp", {
      method: "POST",
      body: { txnId, otp },
    });
    if (result.mock) throw new Error("fallback to sandbox mock");
    return result;
  } catch {
    console.warn("[ABDM Mock] verifyAadhaarOtp");
    if (otp !== "123456") return { success: false, error: "Invalid OTP" };
    return {
      success: true,
      txnId,
      abhaId: `mock-abha-${Date.now()}`,
      abhaNumber: `91-${Date.now().toString().slice(-10)}`,
      token: `mock-token-${Date.now()}`,
    };
  }
}

export async function generateAbhaViaMobile(mobile: string): Promise<AbhaCreateResponse> {
  try {
    const result = await gatewayRequest<AbhaCreateResponse>("/gateway/v0.5/patients/registration/mobile", {
      method: "POST",
      body: { mobile, consent: true },
    });
    if (result.mock) throw new Error("fallback to sandbox mock");
    return result;
  } catch {
    console.warn("[ABDM Mock] generateAbhaViaMobile");
    return {
      success: true,
      txnId: `txn-${Date.now()}`,
      abhaId: `mock-abha-${Date.now()}`,
      abhaNumber: `91-${Date.now().toString().slice(-10)}`,
      token: `mock-token-${Date.now()}`,
    };
  }
}

export async function verifyMobileOtp(txnId: string, otp: string): Promise<AbhaCreateResponse> {
  try {
    const result = await gatewayRequest<AbhaCreateResponse>("/gateway/v0.5/patients/registration/mobile/verify-otp", {
      method: "POST",
      body: { txnId, otp },
    });
    if (result.mock) throw new Error("fallback to sandbox mock");
    return result;
  } catch {
    console.warn("[ABDM Mock] verifyMobileOtp");
    if (otp !== "123456") return { success: false, error: "Invalid OTP" };
    return {
      success: true,
      txnId,
      abhaId: `mock-abha-${Date.now()}`,
      abhaNumber: `91-${Date.now().toString().slice(-10)}`,
      token: `mock-token-${Date.now()}`,
    };
  }
}

export async function verifyAbha(abhaId: string): Promise<{ valid: boolean; abhaId: string; name?: string }> {
  try {
    const result = await gatewayRequest<{ valid: boolean; abhaId: string; name?: string }>(
      `/gateway/v0.5/patients/status`,
      { method: "POST", body: { abhaId } },
    );
    if (result.mock) throw new Error("fallback to sandbox mock");
    return result;
  } catch {
    console.warn("[ABDM Mock] verifyAbha");
    return { valid: true, abhaId, name: "Mock Patient" };
  }
}

export async function searchAbha(
  name: string,
  gender: string,
  dob: string,
  mobile: string,
): Promise<{ success: boolean; results: AbhaSearchResult[] }> {
  try {
    const result = await gatewayRequest<{ success: boolean; results: AbhaSearchResult[] }>(
      "/gateway/v0.5/patients/find-by-patient",
      { method: "POST", body: { name, gender, dob, mobile } },
    );
    if (result.mock) throw new Error("fallback to sandbox mock");
    return result;
  } catch {
    console.warn("[ABDM Mock] searchAbha");
    return {
      success: true,
      results: [{
        abhaId: `mock-abha-${Date.now()}`,
        abhaNumber: `91-${Date.now().toString().slice(-10)}`,
        name, gender, dob, mobile,
      }],
    };
  }
}

export async function getAbhaProfile(abhaId: string, token: string): Promise<AbhaProfile> {
  try {
    const result = await gatewayRequest<AbhaProfile>(
      "/gateway/v0.5/patients/profile",
      { method: "POST", body: { abhaId, token } },
    );
    if (result.mock) throw new Error("fallback to sandbox mock");
    return result;
  } catch {
    console.warn("[ABDM Mock] getAbhaProfile");
    return {
      abhaId,
      abhaNumber: `91-${Date.now().toString().slice(-10)}`,
      name: "Mock Patient",
      gender: "M",
      dob: "1990-01-01",
      mobile: "9876543210",
    };
  }
}
