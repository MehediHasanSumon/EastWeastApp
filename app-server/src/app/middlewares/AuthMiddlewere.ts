import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { verifyRefreshToken } from "../../utils/jwt";
import { Role } from "../models/Role";
import User from "../models/Users";
import UserToken from "../models/UserToken";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const isLoggedIn = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const token = req.headers["x-refresh-token"];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    const decoded = await verifyRefreshToken(token as string);
    const validRefreshToken = await UserToken.findOne({
      refreshToken: token as string,
      userId: decoded.id,
    });

    if (!validRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }
    req.user = user;

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const role = (requiredRoles: string | string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      const userRoles =
        user.roles?.length && typeof user.roles[0] === "object"
          ? user.roles
          : await Role.find({ _id: { $in: user.roles as Types.ObjectId[] } });

      const userRoleNames = userRoles.map((r: any) => r.name);

      const hasRole = roles.some((role) => userRoleNames.includes(role));

      if (!hasRole) {
        res.status(403).json({
          success: false,
          message: "Unauthorized!",
        });
        return;
      }

      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
};

export const isVerified = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user.verify_at) {
    return res.status(403).json({
      success: false,
      message: "Email verification required",
    });
  }

  next();
};
