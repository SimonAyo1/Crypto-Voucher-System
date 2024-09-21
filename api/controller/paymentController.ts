import stripe from "../config/stripeConfig";
import Stripe from "stripe";
import userModel from "../models/Users";
import { Voucher } from "../models/Voucher";
import { Payment } from "../models/Payment";
import {
  fetchLtcPriceInDollars,
  generateRandomCode,
  readHTMLFile,
  sendEmail,
  sendLitecoinTransaction,
  sendSuccessResponse,
} from "../utill/helpers";
import createHttpError from "http-errors";
import { ctrlrFunc } from "controllerFunc";
import path from "path";

import Handlebars from "handlebars";

export class PaymentController {
  ////////////////////////////////////////////////////////////////////////////////////////////////

  static createPaymentIntent: ctrlrFunc = async (req, res, next) => {
    try {
      const { voucherId } = req.body;

      const userId = req.user?.userId;

      const voucher = await Voucher.findById(voucherId);
      if (!voucher) {
        next(createHttpError(404, "Voucher not found"));
        return;
      }

      const user = await userModel.findById(userId);
      if (!user) {
        next(createHttpError(404, "User not found"));
        return;
      }

      const price = await fetchLtcPriceInDollars();

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

      return sendSuccessResponse(
        res,
        "",
        {
          clientSecret: paymentIntent.client_secret,
          pk: process.env.STRIPE_PUBLISHABLE_KEY,
        },
        200
      );
    } catch (error) {
      next(createHttpError(500, "Error creating payment intent", error));
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////

  static handlePaymentWebhook: ctrlrFunc = async (req, res, next) => {
    const event = req.body;

    if (event.type === "payment_intent.succeeded") {
      try {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const { userId, voucherId } = paymentIntent.metadata;
        const user = await userModel.findById(userId);
        if (!user) {
          next(createHttpError(404, "User not found"));
          return;
        }

        const voucher = await Voucher.findById(voucherId);
        if (!voucher) {
          next(createHttpError(404, "Voucher not found"));
          return;
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

        const templatePath = path.join(
          __dirname,
          "..",
          "templates",
          "buyVoucherEmailTemplate.html"
        );
        const htmlTemplate = await readHTMLFile(templatePath);

        const template = Handlebars.compile(htmlTemplate);

        const html = template({
          voucherCode: newVoucher.buyer_unique_voucher_code,
          amount: newVoucher.amount,
          amountPaid: Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(paymentIntent.amount / 100),
          addedAt: newVoucher.addedAt,
        });

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
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////

  static getAmountToPay: ctrlrFunc = async (req, res, next) => {
    const { email, buyer_unique_voucher_code } = req.body;
    try {
      if (!email || !buyer_unique_voucher_code) {
        next(createHttpError.BadRequest());
        return;
      }
      const user = await userModel.findOne({ email });

      if (user) {
        const voucher = user.vouchers.find(
          (voucher: any) =>
            voucher.buyer_unique_voucher_code === buyer_unique_voucher_code
        );

        if (!voucher) {
          next(
            createHttpError.BadRequest(
              `Invalid voucher code: ${buyer_unique_voucher_code}`
            )
          );
          return;
        }

        const price = await fetchLtcPriceInDollars();
        const ltc_to_pay = (voucher.amount - 0.0004) / price;

        return sendSuccessResponse(
          res,
          "",
          {
            message: ltc_to_pay,
          },
          200
        );
      }

      next(
        createHttpError(
          400,
          "This email address is not on our system. Please use a valid email address"
        )
      );
      return;
    } catch (error) {
      next(createHttpError.InternalServerError());
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////

  // Redeem a voucher
  static redeemVoucher: ctrlrFunc = async (req, res, next) => {
    const { buyer_unique_voucher_code, email, walletAddress } = req.body;
    let ltc_to_pay = 0;
    try {
      if (!buyer_unique_voucher_code || !email || !walletAddress) {
        next(createHttpError.BadRequest());
        return;
      }
      const user = await userModel.findOne({ email });

      if (user) {
        const voucher = user.vouchers.find(
          (voucher: any) =>
            voucher.buyer_unique_voucher_code === buyer_unique_voucher_code
        );

        if (!voucher) {
          next(
            createHttpError.BadRequest(
              `Invalid voucher code: ${buyer_unique_voucher_code}`
            )
          );
          return;
        }

        if (voucher.redeemed) {
          next(createHttpError.BadRequest("Voucher already redeemed"));
          return;
        }
        const price = await fetchLtcPriceInDollars();
        ltc_to_pay = (voucher.amount - 0.0004) / price;

        // (voucher.amount - 2.5 - (voucher.amount * 0.15)) / price;
        if (!ltc_to_pay) return;
        // return res
        //   .status(200)
        //   .json({ message: "Voucher redeemed", ltc_to_pay });
        try {
          const response_ltc = await sendLitecoinTransaction({
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

          // const htmlPath = path.join(
          //   __dirname,
          //  '..',
          //   "templates",
          //   "redeemVoucherEmailTemplate.html"
          // );
          // const htmlFile = readHTMLFile(htmlPath);

          // try {
          //   await sendEmail({
          //     subject: `Your Crypto Voucher ${buyer_unique_voucher_code} Has Been Redeemed! `,
          //     to: user.email,
          //     html,
          //     text: `Your Crypto Voucher ${buyer_unique_voucher_code} Has Been Redeemed! `,
          //   });
          // } catch (error) {}

          return sendSuccessResponse(
            res,
            "",
            {
              message: "Voucher redeemed",
              tx: response_ltc.txId,
            },
            200
          );
        } catch (error) {
          next(createHttpError.InternalServerError(error));
        }
      }

      next(
        createHttpError(
          400,
          "This email address is not on our system. Please use a valid email address"
        )
      );
      return;
    } catch (error) {
      next(createHttpError.InternalServerError(error));
    }
  };
}
