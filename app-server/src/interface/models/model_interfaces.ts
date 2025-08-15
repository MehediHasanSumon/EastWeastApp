import { Document, Types } from "mongoose";
import { IPermission } from "../../app/models/Permission";
import { IRole } from "../../app/models/Role";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  verify_at?: Date;
  roles: Types.ObjectId[] | IRole[];
  permissions: Types.ObjectId[] | IPermission[];
  address?: string;
  phone?: string;
  profile_picture?: {
    image: string;
    publicId: string;
  };
  bio?: string;
  date_of_birth?: Date;
  profession?: string;
  status?: boolean;
  // Messaging features
  online?: boolean;
  lastSeen?: Date;
  typingIn?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserToken extends Document {
  userId: Types.ObjectId;
  refreshToken: string;
  clientIp?: string | null;
  publicIp?: string | null;
  privateIp?: string | null;
  userAgent?: string;
  deviceId?: string;
  isRevoked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IResetPasswordToken extends Document {
  email: string;
  token: string;
  createdAt: Date;
}

export interface IEmailVerificationToken extends Document {
  email: string;
  token: number;
  createdAt: Date;
}
