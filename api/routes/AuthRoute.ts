import express from "express";
import { authController } from "../controller/Auth";

export const AuthRouter = express.Router();

AuthRouter.post("/auth/login", authController.Login);

AuthRouter.post("/auth/admin-login", authController.AdminLogin);

AuthRouter.post("/auth/signup", authController.SignUp);
