import mongoose, { Schema } from "mongoose";
import { IUser } from "../../interface/models/model_interfaces";

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verify_at: { type: Date, default: null },
    roles: [{ type: Schema.Types.ObjectId, ref: "Role" }],
    address: { type: String, default: null },
    phone: { type: String, default: null },
    profile_picture: { type: String, default: null },
    bio: { type: String, default: null },
    date_of_birth: { type: Date, default: null },
    profession: { type: String, default: null },
    status: { type: Boolean, default: true },

  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
