import User from "../app/models/Users";
import { isStrongPassword } from "./password";

// Name Validator
export const nameValidator = (
  name: string
): { valid: boolean; message?: string } => {
  if (!name.trim()) {
    return { valid: false, message: "Name is required." };
  }

  if (name.length < 3) {
    return {
      valid: false,
      message: "Name must be at least 3 characters long.",
    };
  }

  return { valid: true };
};

// Email Validator
export const emailValidator = async (
  email: string
): Promise<{ valid: boolean; message?: string }> => {
  if (!email.trim()) {
    return { valid: false, message: "Email is required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Please enter a valid email address." };
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return {
      valid: false,
      message: "This email address is already registered.",
    };
  }

  return { valid: true };
};

// Password Validator
export const passwordValidator = (
  password: string,
  confirm_password: string
): { valid: boolean; message?: string } => {
  if (!password.trim()) {
    return { valid: false, message: "Password is required." };
  }

  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long.",
    };
  }

  if (
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return {
      valid: false,
      message:
        "Password must include uppercase, lowercase, and a numeric character.",
    };
  }

  if (!confirm_password) {
    return { valid: false, message: "Confirm Password is required." };
  }

  if (password !== confirm_password) {
    return {
      valid: false,
      message: "Password and Confirm Password do not match.",
    };
  }

  return { valid: true };
};
