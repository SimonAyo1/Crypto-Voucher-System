import { Router } from "express";
import { UserController } from "../controller/User";
import { adminProtect, userProtect } from "../middlewares/guardRoute";

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
  UserController.unSuspendUser
);

userRoutes.get(
  "/users/:userId/redeemed-vouchers",
  userProtect,
  UserController.getRedeemedVouchers
);

userRoutes.get(
  "/users/:userId/unredeemed-vouchers",
  userProtect,
  UserController.getUnredeemedVouchers
);

export default userRoutes;
