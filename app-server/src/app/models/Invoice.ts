import mongoose, { Schema } from "mongoose";
import { IInvoice } from "../../interface/models/model_interfaces";

const InvoiceSchema: Schema<IInvoice> = new Schema(
  {
    invoice_no: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^[A-Z0-9-]+$/.test(v);
        },
        message: 'Invoice number must contain only uppercase letters, numbers, and hyphens'
      }
    },
    date_time: { 
      type: Date, 
      required: true,
      validate: {
        validator: function(v: Date) {
          return v <= new Date();
        },
        message: 'Date cannot be in the future'
      }
    },
    vehicle_no: { 
      type: String, 
      default: null,
      trim: true,
      validate: {
        validator: function(v: string | null) {
          if (v === null) return true;
          return /^[A-Z0-9-]+$/.test(v);
        },
        message: 'Vehicle number must contain only uppercase letters, numbers, and hyphens'
      }
    },
    customer_name: { 
      type: String, 
      required: true,
      trim: true,
      minlength: [2, 'Customer name must be at least 2 characters long'],
      maxlength: [100, 'Customer name cannot exceed 100 characters']
    },
    customer_phone_number: { 
      type: String, 
      required: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          const cleanPhone = v.replace(/[\s\-\(\)]/g, '');
          return /^(\+?880|0?)(1[3-9]\d{8})$/.test(cleanPhone);
        },
        message: 'Please enter a valid Bangladeshi phone number (e.g., 01712345678, +8801712345678)'
      }
    },
    payment_method: { 
      type: String, 
      required: true,
      enum: ["cash", "card", "bank_transfer", "credit","due"],
      default: "cash"
    },
    product: { 
      type: Schema.Types.ObjectId, 
      ref: "Product", 
      required: true,
      index: true
    },
    seller: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true
    },
    price: { 
      type: Number, 
      required: true,
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: function(v: number) {
          return Number.isFinite(v) && v >= 0;
        },
        message: 'Price must be a valid positive number'
      }
    },
    quantity: { 
      type: Number, 
      required: true,
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: function(v: number) {
          return Number.isInteger(v) && v > 0;
        },
        message: 'Quantity must be a positive integer'
      }
    },
    total_amount: { 
      type: Number, 
      required: true,
      min: [0, 'Total amount cannot be negative'],
      validate: {
        validator: function(v: number) {
          return Number.isFinite(v) && v >= 0;
        },
        message: 'Total amount must be a valid positive number'
      }
    },
    discount: { 
      type: Number, 
      default: 0,
      min: [0, 'Discount cannot be negative'],
      validate: {
        validator: function(v: number) {
          return Number.isFinite(v) && v >= 0;
        },
        message: 'Discount must be a valid non-negative number'
      }
    },
    is_sent_sms: { 
      type: Boolean, 
      default: false 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for calculated total (price * quantity - discount)
InvoiceSchema.virtual('calculated_total').get(function() {
  return (this.price * this.quantity) - this.discount;
});

// Pre-save middleware to validate total_amount matches calculated total
InvoiceSchema.pre('save', function(next) {
  const calculatedTotal = (this.price * this.quantity) - this.discount;
  if (Math.abs(this.total_amount - calculatedTotal) > 0.01) { // Allow for floating point precision
    next(new Error(`Total amount (${this.total_amount}) must equal price (${this.price}) × quantity (${this.quantity}) - discount (${this.discount}) = ${calculatedTotal}`));
  } else {
    next();
  }
});

// Indexes for better query performance
InvoiceSchema.index({ seller: 1, createdAt: -1 });
InvoiceSchema.index({ seller: 1, date_time: -1 });
InvoiceSchema.index({ seller: 1, customer_name: 1 });
InvoiceSchema.index({ seller: 1, invoice_no: 1 });
InvoiceSchema.index({ seller: 1, payment_method: 1 });

const Invoice = mongoose.model<IInvoice>("Invoice", InvoiceSchema);
export default Invoice;