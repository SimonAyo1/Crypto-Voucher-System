import { Schema, model, Types } from "mongoose";

const paymentSchema = new Schema({
  voucherCode: { type: String, required: true },
  paymentIntent: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export const Payment = model("Payment", paymentSchema);
