import { Request, Response } from "express";
import { sendEmailVerificationOTP } from "../../../utils/email/sendMailToUser";
import EmailVerificationToken from "../../models/EmailVetificationToken";
import User from "../../models/Users";

export const sendEmailVetificationToken = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({
        status: false,
        message: "User not found.",
      });
    }

    if (user.verify_at !== null) {
      return res.status(400).send({
        status: false,
        message: "Your email address is already confirmed.",
      });
    }

    const existingToken = await EmailVerificationToken.findOne({ email: user.email });
    if (existingToken) {
      return res.status(400).send({
        status: false,
        message: "Your email verification code has already been sent.",
      });
    }

    await sendEmailVerificationOTP(user);

    return res.status(200).send({
      status: true,
      message: `Email verification code has been sent.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const userEmailVetification = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { token } = req.body;
    const email = req.user.email;

    if (!token) {
      return res.status(400).send({
        status: false,
        error: "Please enter email verification code.",
      });
    }

    const getToken = await EmailVerificationToken.findOne({ email });

    if (getToken === null || getToken.token != token) {
      return res.status(404).send({
        status: false,
        message: "Invalid or expired email confirmation code.",
      });
    }

    await User.updateOne({ email }, { verify_at: Date.now() });
    await EmailVerificationToken.deleteOne({ email });

    return res.status(200).send({
      status: true,
      message: "Email verification has been confirmed successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};
