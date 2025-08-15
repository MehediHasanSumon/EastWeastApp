import mongoose, { Schema } from "mongoose";
import { IProduct } from "../../interface/models/model_interfaces";

const ProductSchema: Schema<IProduct> = new Schema(
  {
    name: { type: String, required: true },
    purchases: { type: Number, required: true, default: 0 },
    sell: { type: Number, required: true, default: 0 },
    description: { type: String, default: null },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Product = mongoose.model<IProduct>("Product", ProductSchema);
export default Product;