import mongoose, { Schema } from "mongoose";
import { IEmailVerificationToken } from "../../interface/models/model_interfaces";

const EmailVerificationTokenSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: Number,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 120,
  },
});

const EmailVerificationToken = mongoose.model<IEmailVerificationToken>(
  "EmailVerificationToken",
  EmailVerificationTokenSchema
);

export default EmailVerificationToken;
