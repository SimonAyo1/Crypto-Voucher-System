import { AuthController } from "../controller/Auth";
import express from "express";

export const AuthRouter = express.Router();

AuthRouter.post("/auth/login", AuthController.login);

AuthRouter.post("/auth/admin-login", AuthController.adminLogin);

AuthRouter.post("/auth/signup", AuthController.signUp);
