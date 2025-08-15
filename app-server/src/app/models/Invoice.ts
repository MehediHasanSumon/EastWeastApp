import mongoose, { Schema } from "mongoose";
import { IInvoice } from "../../interface/models/model_interfaces";

const InvoiceSchema: Schema<IInvoice> = new Schema(
  {
    invoice_no: { type: String, required: true, unique: true },
    date_time: { type: Date, required: true },
    vehicle_no: { type: String, default: null },
    customer_name: { type: String, required: true },
    customer_phone_number: { type: String, required: true },
    payment_method: { 
      type: String, 
      required: true,
      enum: ["cash", "card", "bank_transfer", "credit","due"],
      default: "cash"
    },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    total_amount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    is_sent_sms: { type: Boolean, default: false },
    status: { 
      type: String, 
      required: true,
      enum: ["pending", "paid", "cancelled"],
      default: "pending"
    },
  },
  { timestamps: true }
);

const Invoice = mongoose.model<IInvoice>("Invoice", InvoiceSchema);
export default Invoice;