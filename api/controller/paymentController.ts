import axios from "axios";
import { Request, Response } from "express";
import stripe from "../config/stripeConfig";
import Stripe from "stripe";
import userModel from "../models/Users";
import { Voucher } from "../models/Voucher";
import { Payment } from "../models/Payment";
import { PrivateKey, Transaction } from "litecore-lib";

export class PaymentController {
  static async createPaymentIntent(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { userId, voucherId } = req.body;

      const voucher = await Voucher.findById(voucherId);
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: voucher.amount * 100,
        currency: "usd",
        metadata: {
          userId,
          voucherId,
          voucher_code: voucher.code,
          user_email: user.email,
        },
      });

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        pk: process.env.STRIPE_PUBLISHABLE_KEY,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error creating payment intent", error });
    }
  }

  // T5LAtKoso1pEtbhW7v28UmsXVTtQ36AdhRr8GP6yMkAiG2aKvmni

  static INSIGHT_API_URL = "https://insight.litecore.io/api";

  static async processPayment(req: Request, res: Response): Promise<Response> {
    const { toAddress, amount } = req.body;

    if (!toAddress || !amount) {
      return res
        .status(400)
        .send("Please provide privateKeyWIF, toAddress, and amount.");
    }

    try {
      // Initialize the private key
      const privateKey = PrivateKey.fromWIF(
        ""
      );
      const fromAddress = privateKey.toPublicKey().toAddress().toString();
      // Get UTXOs for the sender's address
      const utxos = await PaymentController.getUTXOs(fromAddress);

      // Calculate the transaction fee
      const fee = 1500; // Set a fixed fee, or calculate based on the size of the transaction

      // Create the transaction
      const tx = new Transaction()
        .from(utxos)
        .to(toAddress, amount * 1e8) // amount is in LTC, convert to satoshis
        .fee(fee)
        .change(fromAddress) // Send the change back to the sender
        .sign(privateKey)
        .serialize();

      // Broadcast the transaction
      const txid = await PaymentController.broadcastTX(tx);
      res.json({ txid });
    } catch (error) {
      res.status(500).send(`Error sending LTC: ${error.message}`);
    }
  }

  static async getUTXOs(address: string): Promise<any> {
    try {
      const response = await axios.get(
        `${PaymentController.INSIGHT_API_URL}/addr/${address}/utxo`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Error retrieving UTXOs: ${error.message}`);
    }
  }

  // Helper  to broadcast the transaction
  static async broadcastTX(rawtx: string): Promise<string> {
    try {
      const response = await axios.post(
        `${PaymentController.INSIGHT_API_URL}/tx/send`,
        {
          rawtx,
        }
      );
      return response.data.txid;
    } catch (error) {
      throw new Error(`Error broadcasting transaction: ${error.message}`);
    }
  }

  static async handlePaymentWebhook(
    req: Request,
    res: Response
  ): Promise<Response> {
    const event = req.body;

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
      await Payment.create({
        paymentIntent: JSON.stringify({ paymentIntent }),
        voucherCode: voucher.code,
      });
    }

    return res.status(200).json({ received: true });
  }
}
