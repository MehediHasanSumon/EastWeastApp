import { Document, Schema, model } from "mongoose";

export interface ISMSTemplate extends Document {
  title: string;
  body?: string;
  isActive?: boolean;
}

const smsTemplateSchema = new Schema<ISMSTemplate>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const SMSTemplate = model<ISMSTemplate>("SMSTemplate", smsTemplateSchema);
