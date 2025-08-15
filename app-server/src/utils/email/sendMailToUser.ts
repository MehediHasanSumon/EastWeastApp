import dotenv from "dotenv";
import EmailVerificationToken from "../../app/models/EmailVetificationToken";
import ResetPasswordToken from "../../app/models/ResetPasswordToken";
import { MailSend } from "../../config/EmailConfig";
import { EUser } from "../../interface/types";
import { generateRandomNumber, generateRandomString } from "../utils";
import EmailVerificationTemplate from "./templates/emailverificationtemplate";
import ForgotPasswodTemplate from "./templates/forgotpasswodtemplate";

dotenv.config();

interface IMailSendResponse {
  accepted?: string[];
  rejected?: string[];
  envelopeTime?: number;
  messageTime?: number;
  messageSize?: number;
  response?: string;
  envelope?: {
    from: string;
    to: string[];
  };
  messageId?: string;
}

const appName: string = process.env.APP_NAME as string;

export const sendEmailVerificationOTP = async (user: EUser): Promise<IMailSendResponse> => {
  const otp: number = generateRandomNumber();
  const token = await EmailVerificationToken.create({ email: user.email, token: otp });
  const otpVerificationLink: string = `${process.env.FRONTEND_HOST}/account/email-verification`;
  const subject: string = "OTP - Verify your account.";
  const template: string = EmailVerificationTemplate(user, token.token, otpVerificationLink, appName);
  const info: IMailSendResponse = await MailSend(user, subject, template);
  return info;
};

export const sendResetPasswordLink = async (user: EUser): Promise<IMailSendResponse> => {
  const token = generateRandomString(60);
  await ResetPasswordToken.create({ email: user.email, token });
  const resetPasswordLink = `${process.env.FRONTEND_HOST}/confirm-password/${token}`;
  const subject = "Reset Your Password and Regain Access to Your Account.";
  const template = ForgotPasswodTemplate(user, resetPasswordLink, appName);
  const info = MailSend(user, subject, template);
  return info;
};
