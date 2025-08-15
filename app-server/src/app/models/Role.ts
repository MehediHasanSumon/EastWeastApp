import { Document, Schema, Types, model } from "mongoose";
import { IPermission } from "./Permission";

export interface IRole extends Document {
  name: string;
  permissions: Types.ObjectId[] | IPermission[];
}

const roleSchema = new Schema<IRole>({
  name: { type: String, required: true, unique: true },
  permissions: [{ type: Schema.Types.ObjectId, ref: "Permission" }],
});

export const Role = model<IRole>("Role", roleSchema);
