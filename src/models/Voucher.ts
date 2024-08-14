import { Schema, model, Types } from "mongoose";

const voucherSchema = new Schema({
  cryptoType: { type: String, required: true },
  amount: { type: Number, required: true },
  code: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export const Voucher = model("Voucher", voucherSchema);
