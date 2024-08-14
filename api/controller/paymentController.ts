import { Request, Response } from "express";
import stripe from "../config/stripeConfig";
import Stripe from "stripe";
import userModel from "../models/Users";
import { Voucher } from "../models/Voucher";

export class PaymentController {
  // Create a payment intent
  static async createPaymentIntent(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { amount } = req.body; // Amount should be in cents

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      return res
        .status(200)
        .json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error creating payment intent", error });
    }
  }

  static async handleWebhook(req: Request, res: Response): Promise<Response> {
    const sig = req.headers["stripe-signature"] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!; 

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const { userId, voucherId } = paymentIntent.metadata;

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const voucher = await Voucher.findById(voucherId);
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      const newVoucher = {
        code: voucher.code,
        cryptoType: voucher.cryptoType,
        amount: voucher.amount,
        redeemed: false,
        addedAt: new Date(),
      };

      user.vouchers.push(newVoucher);
      await user.save();
    }

    return res.status(200).json({ received: true });
  }
}
