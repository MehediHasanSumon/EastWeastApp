import dotenv from "dotenv";
import { EUser } from "../../../interface/types";
dotenv.config();

const ForgotPasswodTemplate = (user: EUser, resetPasswordLink: string, appName: string) => {
  const template = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Password Reset</title>
      <style>
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap");
        body {
          font-family: "Poppins", sans-serif;
          background-color: #f5f7fa;
          margin: 0;
          padding: 0;
          color: #333;
          line-height: 1.6;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px 20px;
          text-align: center;
          color: white;
        }
        .logo-img {
          height: 80px;
          width: 80px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 10px;
          border: 3px solid white;
        }
        .content {
          padding: 30px;
        }
        h1 {
          color: #2d3748;
          font-size: 24px;
          margin-top: 0;
          margin-bottom: 20px;
        }
        p {
          margin-bottom: 20px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #718096;
          background-color: #f8fafc;
        }
        .divider {
          height: 1px;
          background-color: #e2e8f0;
          margin: 25px 0;
        }
        .small-text {
          font-size: 13px;
          color: #718096;
        }
        .option-title {
          font-weight: 500;
          color: #2d3748;
          margin-bottom: 10px;
        }
        .reset-link {
          word-break: break-all;
          background: #f8fafc;
          padding: 10px;
          border-radius: 6px;
          font-size: 14px;
          display: inline-block;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <img
            src="https://res.cloudinary.com/doxgutilx/image/upload/v1749751906/images/wz6zcs5zdys2georwij6.png"
            alt="Company Logo"
            class="logo-img"
          />
          <div>Password Reset Assistance</div>
        </div>
        <div class="content">
          <h1>Hello ${user.name},</h1>
          <p>
            We've received a request to update your account password. Please use one of these secure methods to proceed:
          </p>
        <div class="option-title">Verification Options</div>
        <p>Copy and paste this link into your browser or click on this link:</p>
        <div class="reset-link"><a href="${resetPasswordLink}">${resetPasswordLink}</a></div>
          <p>For your security, this verification link will automatically expire in 3 minutes.</p>
          <div class="divider"></div>
          <p class="small-text">
            If you didn't initiate this password change request, no action is needed - your account remains secure.
          </p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} ${appName}. All rights reserved.<br />
          <a href="#" style="color: #718096; text-decoration: none">Privacy Policy</a> |
          <a href="#" style="color: #718096; text-decoration: none">Terms of Service</a>
        </div>
      </div>
    </body>
  </html>`;

  return template;
};
export default ForgotPasswodTemplate;
