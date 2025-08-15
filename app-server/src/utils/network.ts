/**
 * Validates if a string is a valid IPv4 or IPv6 address
 * @param ip - The IP address to validate
 * @returns boolean - True if the IP is valid, false otherwise
 */
export const isValidIP = (ip: string | undefined | null): boolean => {
  if (!ip || typeof ip !== "string") {
    return false;
  }

  // Trim and handle potential port numbers (e.g., "192.168.1.1:8080")
  const cleanIp = ip.split(":")[0].trim();
  if (!cleanIp) {
    return false;
  }

  // IPv4 validation regex
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 validation regex (simplified)
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  // Check for IPv4
  if (ipv4Regex.test(cleanIp)) {
    return true;
  }

  // Check for IPv6 (including compressed forms)
  if (ipv6Regex.test(cleanIp)) {
    return true;
  }

  // Check for localhost variants
  if (cleanIp === "localhost" || cleanIp === "::1" || cleanIp === "127.0.0.1") {
    return true;
  }

  return false;
};

// Additional utility function to check if IP is private/internal
export const isPrivateIP = (ip: string): boolean => {
  if (!isValidIP(ip)) {
    return false;
  }

  // Handle IPv4 private ranges
  if (ip.includes(".")) {
    const parts = ip.split(".").map(Number);

    // 10.0.0.0 - 10.255.255.255
    if (parts[0] === 10) return true;

    // 172.16.0.0 - 172.31.255.255
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0 - 192.168.255.255
    if (parts[0] === 192 && parts[1] === 168) return true;

    // 127.0.0.0 - 127.255.255.255
    if (parts[0] === 127) return true;

    // 169.254.0.0 - 169.254.255.255 (APIPA)
    if (parts[0] === 169 && parts[1] === 254) return true;
  }

  // Handle IPv6 private ranges
  if (ip.includes(":")) {
    // ::1 (localhost)
    if (ip === "::1") return true;

    // fc00::/7 (unique local address)
    if (ip.startsWith("fc") || ip.startsWith("fd")) return true;

    // fe80::/10 (link-local)
    if (ip.startsWith("fe80:")) return true;
  }

  return false;
};

// Utility function to get IP version (4 or 6)
export const getIPVersion = (ip: string): 4 | 6 | null => {
  if (!isValidIP(ip)) return null;
  return ip.includes(":") ? 6 : 4;
};
