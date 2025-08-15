import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { promisify } from "util";
dotenv.config();

/**
 * Interface representing the JWT payload structure
 * @property id - User identifier (required)
 * @property [key: string] - Additional optional claims
 */
interface TokenPayload {
  id: string;
  [key: string]: any;
}

/**
 * Interface representing an access token with its expiration in milliseconds
 */
interface AccessTokenWithExpiry {
  accessToken: string;
  accessTokenExpiresIn: number; // milliseconds
}

/**
 * Interface representing a refresh token with its expiration in milliseconds
 */
interface RefreshTokenWithExpiry {
  refreshToken: string;
  refreshTokenExpiresIn: number; // milliseconds
}

// Validate critical environment variables on startup
const validateEnvironment = () => {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error(
      "Missing JWT secrets in environment variables. Ensure ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are set."
    );
  }
};

// Execute environment validation immediately
validateEnvironment();

/**
 * JWT configuration with type safety and production defaults
 */
const JWT_CONFIG = {
  accessToken: {
    secret: process.env.ACCESS_TOKEN_SECRET as string,
    expiresIn: "15m", // 15 minutes
  },
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET as string,
    expiresIn: "7d", // 7 days
  },
};

// Promisify jwt functions for async/await usage
const signAsync = promisify<string | object | Buffer, jwt.Secret, jwt.SignOptions>(jwt.sign) as any;
const verifyAsync = promisify<string, jwt.Secret>(jwt.verify) as any;

/**
 * Generates a signed JWT access token with expiration in milliseconds
 * @param user - User object containing at minimum an _id property
 * @returns Promise resolving to AccessTokenWithExpiry object
 * @throws Error with descriptive message if token generation fails
 */
export async function generateAccessToken(user: { _id: string }): Promise<AccessTokenWithExpiry> {
  if (!user?._id) {
    throw new Error("User ID is required for token generation");
  }

  try {
    const payload: TokenPayload = { id: user._id };
    const expiresIn = JWT_CONFIG.accessToken.expiresIn;
    const secret = JWT_CONFIG.accessToken.secret;

    const token = (await signAsync(payload, secret, {
      expiresIn,
    })) as string;

    const expiresInMs = convertExpiresInToMs(expiresIn);

    return {
      accessToken: token,
      accessTokenExpiresIn: expiresInMs,
    };
  } catch (error) {
    console.error("Access token generation error:", error instanceof Error ? error.message : "Unknown error");
    throw new Error("Failed to generate secure access token");
  }
}

/**
 * Generates a signed JWT refresh token with expiration in milliseconds
 * @param user - User object containing at minimum an _id property
 * @returns Promise resolving to RefreshTokenWithExpiry object
 * @throws Error with descriptive message if token generation fails
 */
export async function generateRefreshToken(user: { _id: string }): Promise<RefreshTokenWithExpiry> {
  if (!user?._id) {
    throw new Error("User ID is required for token generation");
  }

  try {
    const payload: TokenPayload = { id: user._id };
    const expiresIn = JWT_CONFIG.refreshToken.expiresIn;
    const secret = JWT_CONFIG.refreshToken.secret;

    const token = (await signAsync(payload, secret, {
      expiresIn,
    })) as string;

    const expiresInMs = convertExpiresInToMs(expiresIn);

    return {
      refreshToken: token,
      refreshTokenExpiresIn: expiresInMs,
    };
  } catch (error) {
    console.error("Refresh token generation error:", error instanceof Error ? error.message : "Unknown error");
    throw new Error("Failed to generate secure refresh token");
  }
}

/**
 * Verifies the validity of an access token
 * @param token - The JWT access token to verify
 * @returns Promise resolving to the decoded token payload
 * @throws Error with descriptive message if verification fails
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  if (!token) {
    throw new Error("Access token is required for verification");
  }

  try {
    const payload = (await verifyAsync(token, JWT_CONFIG.accessToken.secret)) as TokenPayload;

    if (!payload.id) {
      throw new Error("Invalid token payload: missing user ID");
    }

    return payload;
  } catch (error) {
    const errorMessage =
      error instanceof jwt.TokenExpiredError
        ? "Access token has expired"
        : error instanceof jwt.JsonWebTokenError
          ? "Invalid access token"
          : "Failed to verify access token";

    throw new Error(errorMessage);
  }
}

/**
 * Verifies the validity of a refresh token
 * @param token - The JWT refresh token to verify
 * @returns Promise resolving to the decoded token payload
 * @throws Error with descriptive message if verification fails
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  if (!token) {
    throw new Error("Refresh token is required for verification");
  }

  try {
    const payload = (await verifyAsync(token, JWT_CONFIG.refreshToken.secret)) as TokenPayload;

    if (!payload.id) {
      throw new Error("Invalid token payload: missing user ID");
    }

    return payload;
  } catch (error) {
    const errorMessage =
      error instanceof jwt.TokenExpiredError
        ? "Refresh token has expired"
        : error instanceof jwt.JsonWebTokenError
          ? "Invalid refresh token"
          : "Failed to verify refresh token";

    throw new Error(errorMessage);
  }
}

/**
 * Converts JWT expiresIn string to milliseconds
 * @param expiresIn - JWT expiresIn string (e.g., "15m", "7d") or number (seconds)
 * @returns Expiration time in milliseconds
 */
function convertExpiresInToMs(expiresIn: string | number): number {
  let value: number;
  let multiplier = 1000; // Default to seconds

  if (typeof expiresIn === "string") {
    // Extract numeric value and unit
    const numStr = expiresIn.match(/^\d+/)?.[0] || "0";
    value = parseInt(numStr, 10);
    const unit = expiresIn.slice(-1);

    // Set multiplier based on unit
    switch (unit) {
      case "s": // seconds
        multiplier = 1000;
        break;
      case "m": // minutes
        multiplier = 60 * 1000;
        break;
      case "h": // hours
        multiplier = 60 * 60 * 1000;
        break;
      case "d": // days
        multiplier = 24 * 60 * 60 * 1000;
        break;
      default:
        // If no unit, assume seconds
        multiplier = 1000;
    }
  } else {
    // If number, assume it's in seconds
    value = expiresIn;
    multiplier = 1000;
  }

  return value * multiplier;
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
