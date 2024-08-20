import mongoose, { Schema, Document } from "mongoose";

interface Voucher {
  code: string;
  addedAt: Date;
  redeemed: boolean;
  cryptoType: string;
  amount: number;
}

interface User extends Document {
  email: string;
  password: string;
  vouchers: Voucher[];
  suspended: boolean;
}

const userSchema = new Schema<User>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  vouchers: [
    {
      code: String,
      addedAt: { type: Date, default: Date.now },
      redeemed: { type: Boolean, default: false },
      cryptoType: { type: String, required: true },
      amount: { type: Number, required: true },
    },
  ],
  suspended: {
    type: Boolean,
    default: false,
  },
});

const userModel = mongoose.model<User>("User", userSchema);

export default userModel;
