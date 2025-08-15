import { Request } from "express";

import UserToken from "../app/models/UserToken";

export const storeRefreshToken = async (
  userId: string,
  refreshToken: string,
  deviceId: string,
  req: Request
): Promise<boolean> => {
  try {
    const publicIpResponse = await fetch("https://api.ipify.org?format=json");
    const publicIp = (await publicIpResponse.json()).ip;

    const userAgent = req.headers["user-agent"] || null;
    const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || null;
    const privateIp = req.headers["x-private-ip"]?.toString() || null;

    if (userId && deviceId && publicIp) {
      await UserToken.deleteMany({ userId, deviceId });
    }

    const newToken = new UserToken({
      userId,
      refreshToken,
      clientIp: Array.isArray(clientIp) ? clientIp[0] : clientIp,
      publicIp,
      privateIp,
      userAgent,
      deviceId,
      isRevoked: false,
    }).save();

    if (!newToken) {
      console.error("Failed to create new UserToken");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error storing refresh token:", error);
    return false;
  }
};
