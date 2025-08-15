import { Request, Response } from "express";
import { sendResetPasswordLink } from "../../../utils/email/sendMailToUser";
import { hashPassword } from "../../../utils/password";
import { passwordValidator } from "../../../utils/validate";
import ResetPasswordToken from "../../models/ResetPasswordToken";
import User from "../../models/Users";

export const forgetPassword = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { email } = req.body;

    if (!email.trim()) {
      return res.status(400).send({
        status: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send({
        status: false,
        message: "No account is associated with this email address.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({
        status: false,
        message: "Please enter a valid email address.",
      });
    }

    const token = await ResetPasswordToken.findOne({ email: user.email });
    if (token) {
      return res.status(400).send({
        status: false,
        message: "An email has already been sent. Please check your inbox.",
      });
    }

    await sendResetPasswordLink(user);

    return res.status(200).send({
      status: true,
      message: `Email verification code has been sent.`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const confirmPassword = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { token } = req.params;
    const { password, confirm_password } = req.body;

    const getToken = await ResetPasswordToken.findOne({ token });
    if (!token || !token.trim() || !getToken) {
      return res.status(400).send({
        status: false,
        message: "Invalid or expired password reset token.",
      });
    }

    const passwordValidation = passwordValidator(password, confirm_password);
    if (!passwordValidation.valid) {
      return res.status(400).send({
        status: false,
        message: passwordValidation.message,
      });
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.findOne({ email: getToken.email });

    if (!user) {
      return res.status(400).send({
        status: false,
        message: "User not found.",
      });
    }

    await User.updateOne({ _id: user._id }, { password: hashedPassword });
    await getToken.deleteOne();

    return res.status(200).send({
      status: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.log("Error resetting password:", error);
    return res.status(500).send({
      status: false,
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};

export const checkResetPasswordToken = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { token } = req.params;

    const getToken = await ResetPasswordToken.findOne({ token });
    if (!token || !token.trim() || !getToken) {
      return res.status(404).send({
        status: false,
        message: "Invalid or expired password reset token.",
      });
    }

    return res.status(200).send({
      status: true,
      message: "success",
    });
  } catch (error) {
    console.log("Error resetting password:", error);
    return res.status(500).send({
      status: false,
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};
