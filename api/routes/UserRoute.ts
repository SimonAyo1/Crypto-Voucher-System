import { Router } from "express";
import { UserController } from "../controller/User";

const userRoutes = Router();

userRoutes.post("/users/buy-voucher", UserController.buyVoucher);

userRoutes.get("/users", UserController.getAllUsers);

userRoutes.put("/users/suspend/:userId", UserController.suspendUser);

userRoutes.put("/users/unsuspend/:userId", UserController.unsuspendUser);

userRoutes.get(
  "/users/:userId/redeemed-vouchers",
  UserController.getRedeemedVouchers
);

userRoutes.get(
  "/users/:userId/unredeemed-vouchers",
  UserController.getUnredeemedVouchers
);

userRoutes.post("/users/redeem-voucher", UserController.redeemVoucher);

export default userRoutes;
