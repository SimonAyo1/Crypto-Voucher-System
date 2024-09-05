import { protect } from "../utill/protect";
import { PaymentController } from "./../controller/paymentController";
import express, { Router } from "express";

const paymentRoutes = Router();

paymentRoutes.post("/payment/buy-voucher", protect, PaymentController.createPaymentIntent);
paymentRoutes.post("/payment/webhook", express.json({type: 'application/json'}), PaymentController.handlePaymentWebhook);
paymentRoutes.post("/payment/redeem-voucher", protect, PaymentController.redeemVoucher);

export default paymentRoutes;
