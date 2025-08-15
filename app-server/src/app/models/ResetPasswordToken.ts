import mongoose, { Schema } from "mongoose";
import { IResetPasswordToken } from "../../interface/models/model_interfaces";

const ResetPasswordTokenSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 180,
  },
});

const ResetPasswordToken = mongoose.model<IResetPasswordToken>("ResetPasswordToken", ResetPasswordTokenSchema);

export default ResetPasswordToken;
