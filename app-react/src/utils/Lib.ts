import { getCookie, setCookie } from "./Storage";

export function stringToHex(str: string): string {
  let hex = "";
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const hexValue = charCode.toString(16);
    hex += hexValue.padStart(2, "0");
  }
  return hex;
}

export function hexToString(hex: string | null | undefined): string {
  // Handle null/undefined input
  if (hex == null) {
    return ""; // or throw an error if you prefer
  }

  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, "");

  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }

  let str = "";
  for (let i = 0; i < cleanHex.length; i += 2) {
    const hexValue = cleanHex.substr(i, 2);
    const charCode = parseInt(hexValue, 16);

    if (isNaN(charCode)) {
      throw new Error(`Invalid hex sequence: ${hexValue}`);
    }

    str += String.fromCharCode(charCode);
  }
  return str;
}

export function getOrCreateDeviceId(): boolean {
  let deviceId = getCookie("dvcid");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    setCookie("dvcid", deviceId, 30 * 24 * 60 * 60);
    return true;
  }
  return false;
}
