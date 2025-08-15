import bcrypt from "bcryptjs";

// Configuration
const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Checks if a password meets strength requirements
 * @param password The password to validate
 * @returns Object with isValid boolean and optional message
 */
export const isStrongPassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    };
  }

  const requirements = {
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const missingRequirements = Object.entries(requirements)
    .filter(([_, meets]) => !meets)
    .map(([req]) => req.replace("has", "lowercase, uppercase, number, or special character"));

  if (missingRequirements.length > 0) {
    return {
      isValid: false,
      message: `Password must contain at least one ${missingRequirements.join(", ")}`,
    };
  }

  return { isValid: true };
};

/**
 * Hashes a password using bcrypt
 * @param plainPassword The plain text password to hash
 * @returns Promise that resolves to the hashed password
 */
export const hashPassword = async (plainPassword: string): Promise<string | any> => {
  if (!plainPassword) {
    throw new Error("Password is required for hashing");
  }

  const { isValid, message } = isStrongPassword(plainPassword);
  if (!isValid) {
    throw new Error(message || "Password does not meet strength requirements");
  }

  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/**
 * Compares a plain text password with a hashed password
 * @param plainPassword The plain text password to compare
 * @param hashedPassword The hashed password to compare against
 * @returns Promise that resolves to boolean indicating if passwords match
 */
export const comparePasswords = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  if (!plainPassword || !hashedPassword) {
    throw new Error("Both plain password and hashed password are required for comparison");
  }

  return await bcrypt.compare(plainPassword, hashedPassword);
};
