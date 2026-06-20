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

export async function generateAbhaViaAadhaar(aadhaar: string, txnId: string): Promise<AbhaCreateResponse> {
  console.warn("[ABDM Mock] generateAbhaViaAadhaar — mock endpoint, no real ABHA created");
  return {
    success: true,
    txnId,
    abhaId: `mock-abha-${Date.now()}`,
    abhaNumber: `91-${Date.now().toString().slice(-10)}`,
    token: `mock-token-${Date.now()}`,
  };
}

export async function verifyAadhaarOtp(txnId: string, otp: string): Promise<AbhaCreateResponse> {
  console.warn("[ABDM Mock] verifyAadhaarOtp — mock verification");
  if (otp !== "123456") {
    return { success: false, error: "Invalid OTP" };
  }
  return {
    success: true,
    txnId,
    abhaId: `mock-abha-${Date.now()}`,
    abhaNumber: `91-${Date.now().toString().slice(-10)}`,
    token: `mock-token-${Date.now()}`,
  };
}

export async function generateAbhaViaMobile(mobile: string): Promise<AbhaCreateResponse> {
  console.warn("[ABDM Mock] generateAbhaViaMobile — mock endpoint");
  return {
    success: true,
    txnId: `txn-${Date.now()}`,
    abhaId: `mock-abha-${Date.now()}`,
    abhaNumber: `91-${Date.now().toString().slice(-10)}`,
    token: `mock-token-${Date.now()}`,
  };
}

export async function verifyMobileOtp(txnId: string, otp: string): Promise<AbhaCreateResponse> {
  console.warn("[ABDM Mock] verifyMobileOtp — mock verification");
  if (otp !== "123456") {
    return { success: false, error: "Invalid OTP" };
  }
  return {
    success: true,
    txnId,
    abhaId: `mock-abha-${Date.now()}`,
    abhaNumber: `91-${Date.now().toString().slice(-10)}`,
    token: `mock-token-${Date.now()}`,
  };
}

export async function verifyAbha(abhaId: string): Promise<{ valid: boolean; abhaId: string; name?: string }> {
  console.warn("[ABDM Mock] verifyAbha — mock verification");
  return { valid: true, abhaId, name: "Mock Patient" };
}

export async function searchAbha(
  name: string,
  gender: string,
  dob: string,
  mobile: string,
): Promise<{ success: boolean; results: AbhaSearchResult[] }> {
  console.warn("[ABDM Mock] searchAbha — mock search");
  return {
    success: true,
    results: [
      {
        abhaId: `mock-abha-${Date.now()}`,
        abhaNumber: `91-${Date.now().toString().slice(-10)}`,
        name,
        gender,
        dob,
        mobile,
      },
    ],
  };
}

export async function getAbhaProfile(abhaId: string, token: string): Promise<AbhaProfile> {
  console.warn("[ABDM Mock] getAbhaProfile — mock profile");
  return {
    abhaId,
    abhaNumber: `91-${Date.now().toString().slice(-10)}`,
    name: "Mock Patient",
    gender: "M",
    dob: "1990-01-01",
    mobile: "9876543210",
  };
}
