import mongoose, { Schema } from "mongoose";

import { IUserToken } from "../../interface/models/model_interfaces";

const UserTokenSchema: Schema = new Schema<IUserToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    clientIp: {
      type: String,
      default: null,
    },
    publicIp: {
      type: String,
      default: null,
    },
    privateIp: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    deviceId: {
      type: String,
      default: null,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    expires: "15d",
  },
);

const UserToken = mongoose.model<IUserToken>("UserToken", UserTokenSchema);
export default UserToken;
