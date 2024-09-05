import axios from "axios";
import { Request, Response } from "express";
import stripe from "../config/stripeConfig";
import Stripe from "stripe";
import userModel from "../models/Users";
import { Voucher } from "../models/Voucher";
import { Payment } from "../models/Payment";
import { generateRandomCode } from "../utill/helpers";

interface FromAddress {
  address: string;
  privateKey: string;
}

interface ToAddress {
  address: string;
  value: number;
}

interface LitecoinTransactionData {
  fromAddress: FromAddress[];
  to: ToAddress[];
  fee: string;
  changeAddress: string;
}

export class PaymentController {
  static async createPaymentIntent(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { userId, voucherId } = req.body;
      console.log(req.body);

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

      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      // const newVoucher = {
      //   code: voucher.code,
      //   cryptoType: voucher.cryptoType,
      //   amount: voucher.amount,
      //   redeemed: false,
      //   addedAt: new Date(),
      //   buyer_unique_voucher_code: generateRandomCode(16),
      // };

      // user.vouchers.push(newVoucher);
      // await user.save();

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
        buyer_unique_voucher_code: generateRandomCode(16),
      };

      user.vouchers.push(newVoucher);
      await user.save();
      await Payment.create({
        paymentIntent: JSON.stringify({ paymentIntent }),
        voucherCode: voucher.code,
      });
    }

    return res.status(200).json({ received: true }); //
  }

  static async fetchLtcPriceInDollars(): Promise<number | null> {
    try {
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price",
        {
          params: {
            ids: "litecoin",
            vs_currencies: "usd",
          },
        }
      );

      const ltcPriceInDollars = response.data.litecoin.usd;
      return ltcPriceInDollars;
    } catch (error) {
      console.error("Error fetching LTC price:", error);
      return null;
    }
  }

  static async sendLitecoinTransaction(
    transactionData: LitecoinTransactionData
  ): Promise<any> {
    const url = "https://api.tatum.io/v3/litecoin/transaction";

    try {
      const response = await axios.post(url, transactionData, {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-api-key": process.env.TATUM_API_KEY,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error sending Litecoin transaction:", error);
      throw error;
    }
  }

  // Redeem a voucher
  static async redeemVoucher(req: Request, res: Response): Promise<Response> {
    const { buyer_unique_voucher_code, email, walletAddress } = req.body;

    try {
      if (!buyer_unique_voucher_code || !email || !walletAddress) {
        return res.status(400).json({ message: "Bad request" });
      }
      const user = await userModel.findOne({ email });
      // console.log(user);

      if (user) {
        const voucher = user.vouchers.find(
          (voucher: any) =>
            voucher.buyer_unique_voucher_code === buyer_unique_voucher_code
        );

        if (voucher.redeemed) {
          return res.status(400).json({ message: "Voucher already redeemed" });
        }
        const price = await PaymentController.fetchLtcPriceInDollars();
        const ltc_to_pay = (voucher.amount - 0.0004) / price;

        // (voucher.amount - 2.5 - (voucher.amount * 0.15)) / price;
        if (!ltc_to_pay) return;
        // return res
        //   .status(200)
        //   .json({ message: "Voucher redeemed", ltc_to_pay });
        try {
          const res = await PaymentController.sendLitecoinTransaction({
            changeAddress: process.env.PAYMENT_WALLET,
            fee: "0.0015",
            fromAddress: [
              {
                address: process.env.PAYMENT_WALLET,
                privateKey: process.env.PAYMENT_PRIVATE_KEY,
              },
            ],
            to: [
              {
                address: walletAddress,
                // value: Number(ltc_to_pay.toFixed(8)),
                value: Number(0.001),
              },
            ],
          });
          voucher.redeemed = true;
          await user.save();

          return res.status(200).json({ message: "Voucher redeemed", voucher });
        } catch (error) {
          return res.status(500).json({ message: "Error", error });
        }
      }

      return res.status(400).json({ message: "Validation Error" });
    } catch (error) {
      return res.status(400).json({
        message: {
          error,
        },
      });
    }
  }
}
