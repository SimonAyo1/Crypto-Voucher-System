import { userProtect } from "../middlewares/guardRoute";
import { PaymentController } from "./../controller/paymentController";
import express, { Router } from "express";

const paymentRoutes = Router();

paymentRoutes.post("/payment/buy-voucher", userProtect, PaymentController.createPaymentIntent);
paymentRoutes.post("/payment/webhook", express.json({type: 'application/json'}), PaymentController.handlePaymentWebhook);
paymentRoutes.post("/payment/redeem-voucher", PaymentController.redeemVoucher);
paymentRoutes.post("/payment/getamounttopay", PaymentController.getAmountToPay);

export default paymentRoutes;
