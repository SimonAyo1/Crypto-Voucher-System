import axios from "axios";
import { Request, Response } from "express";
import stripe from "../config/stripeConfig";
import Stripe from "stripe";
import userModel from "../models/Users";
import { Voucher } from "../models/Voucher";
import { Payment } from "../models/Payment";
import { generateRandomCode } from "../utill/helpers";
import { sendEmail } from "../utill/mail";

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

      const voucher = await Voucher.findById(voucherId);
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const price = await PaymentController.fetchLtcPriceInDollars();

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.ceil(price * voucher.amount * 100),
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
      console.error(error);
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
    try {
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

      const newVoucher: any = {
        code: voucher.code,
        cryptoType: voucher.cryptoType,
        amount: voucher.amount,
        redeemed: false,
        addedAt: new Date().toISOString(),
        buyer_unique_voucher_code: generateRandomCode(16),
      };

      user.vouchers.push(newVoucher);
      await user.save();
      await Payment.create({
        paymentIntent: JSON.stringify({ paymentIntent }),
        voucherCode: voucher.code,
      });

      const html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Your Purchase</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background-color: #007bff;
            color: #ffffff;
            text-align: center;
            padding: 20px;
            font-size: 24px;
          }
          .content {
            padding: 30px;
          }
          .content h1 {
            font-size: 22px;
            margin-bottom: 20px;
          }
          .content p {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .details {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
          }
          .details h2 {
            font-size: 18px;
            margin-bottom: 10px;
            color: #007bff;
          }
          .details p {
            margin: 5px 0;
            font-size: 16px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            background-color: #f4f4f4;
            font-size: 14px;
            color: #999;
          }
          .footer a {
            color: #007bff;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Email Header -->
          <div class="header">
            Thank You for Your Purchase!
          </div>
      
          <!-- Email Body -->
          <div class="content">
            <h1>Hi,</h1>
            <p>Thank you for purchasing a crypto voucher from us! We truly appreciate your business and are here to make sure you have the best experience possible.</p>
            <p>Below are the details of your voucher:</p>
      
            <!-- Voucher Details -->
            <div class="details">
              <h2>Voucher Details</h2>
              <p><strong>Voucher Code:</strong> ${
                newVoucher.buyer_unique_voucher_code
              }</p>
              <p><strong>Voucher:</strong> ${newVoucher.amount} LTC</p>
              <p><strong>Amount Paid:</strong> 
              ${Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(paymentIntent.amount / 100)}
            </p>
            
              <p><strong>Date of Purchase:</strong> ${newVoucher.addedAt}</p>
            </div>
      
            <p>If you have any questions or need further assistance, feel free to <a href="mailto:support@vouchercv.com">contact us</a>.</p>
      
            <p>Best regards,</p>
            <p><strong>CV Voucher</strong></p>
          </div>
      
          <!-- Email Footer -->
          <div class="footer">
            <p>&copy; 2024 CV Voucher. All rights reserved.</p>
            <p><a href="#">Unsubscribe</a> | <a href="#">Privacy Policy</a></p>
          </div>
        </div>
      </body>
      </html>
      `;

      await sendEmail({
        subject: "Your Crypto Voucher Purchase is Complete! ",
        to: user.email,
        html,
        text: "Thank You for Purchasing Your Crypto Voucher!",
      });
    } catch (error) {
      console.log(error);
    }
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
