import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { SentMessageInfo, Transporter } from "nodemailer";

dotenv.config();

// Define interface for the user parameter
interface IUser {
  email: string;
  // Add other user properties if needed
  // name?: string;
  // id?: string;
}

export const MailSend = async (user: IUser, subject: string, htmlTemplate: string): Promise<SentMessageInfo> => {
  try {
    if (!user || !subject || !htmlTemplate) {
      throw new Error("Missing required fields: user, subject, or htmlTemplate");
    }

    const transporter: Transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST as string,
      port: parseInt(process.env.EMAIL_PORT as string),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER as string,
        pass: process.env.EMAIL_PASS as string,
      },
    });

    const mailOptions = {
      from: process.env.APP_NAME || "Md Mehedi Hasan",
      to: user.email,
      subject: subject,
      html: htmlTemplate,
    };

    const info: SentMessageInfo = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return info;
  } catch (error: unknown) {
    console.error("Error occurred while sending email:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
};
