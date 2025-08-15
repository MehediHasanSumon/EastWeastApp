import { Document, Schema, model } from "mongoose";

export interface IPermission extends Document {
  name: string;
  guard?: string;
}

const permissionSchema = new Schema<IPermission>({
  name: { type: String, required: true, unique: true },
  guard: { type: String, default: "web" },
});

export const Permission = model<IPermission>("Permission", permissionSchema);
