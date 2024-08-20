import { Router } from "express";
import { UserController } from "../controller/User";
import { protect } from "../utill/protect";
import { adminProtect } from "../utill/adminProtect";

const userRoutes = Router();

userRoutes.get("/users", UserController.getAllUsers);

userRoutes.put(
  "/users/suspend/:userId",
  adminProtect,
  UserController.suspendUser
);

userRoutes.put(
  "/users/unsuspend/:userId",
  adminProtect,
  UserController.unsuspendUser
);

userRoutes.get(
  "/users/:userId/redeemed-vouchers",
  UserController.getRedeemedVouchers
);

userRoutes.get(
  "/users/:userId/unredeemed-vouchers",
  UserController.getUnredeemedVouchers
);

userRoutes.post("/users/redeem-voucher", protect, UserController.redeemVoucher);

export default userRoutes;
