import UserModel from "../models/Users";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import adminModel from "../models/Admin";
import userModel from "../models/Users";
import createHttpError from "http-errors";
import { sendSuccessResponse } from "../utill/helpers";
import { ctrlrFunc } from "controllerFunc";
dotenv.config();

export class AuthController {
  ////////////////////////////////////////////////////////////////////////////////////////////////

  static login: ctrlrFunc = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(createHttpError(400, "Email and password are required"));
      }

      const user = await UserModel.findOne({ email });
      if (!user) {
        return next(createHttpError(400, "Invalid email or password"));
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password as string
      );
      if (!isPasswordValid) {
        return next(
          createHttpError(400, "Authentication failed, wrong password")
        );
      }

      const token = jwt.sign(
        { email, userId: user._id },
        process.env.SECRET_KEY || "default_secret_key",
        { expiresIn: "1h" }
      );

      sendSuccessResponse(
        res,
        "Authentication successful",
        { token, user: { email: user.email, id: user._id } },
        200
      );
    } catch (error) {
      return next(createHttpError(500, "An error occurred during login"));
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////

  static adminLogin: ctrlrFunc = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(createHttpError(400, "Email and password are required"));
      }

      const admin = await adminModel.findOne({ email });
      if (!admin) {
        return next(createHttpError(400, "Authentication failed"));
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        admin.password as string
      );
      if (!isPasswordValid) {
        return next(
          createHttpError(400, "Authentication failed, wrong password")
        );
      }

      const token = jwt.sign(
        { email: admin.email, userId: admin._id, role: "admin" },
        process.env.SECRET_KEY || "default_secret_key",
        { expiresIn: "1h" }
      );

      sendSuccessResponse(
        res,
        "Authentication successful",
        { email: admin.email, token },
        200
      );
    } catch (error) {
      return next(createHttpError(500, "An error occurred during admin login"));
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////

  static signUp: ctrlrFunc = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(createHttpError(400, "Email and password are required"));
      }

      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        return next(createHttpError(400, "Email has already been taken"));
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await userModel.create({
        email,
        password: hashedPassword,
      });

      sendSuccessResponse(
        res,
        "Registered successfully",
        { email: user.email, id: user._id },
        200
      );
    } catch (error) {
      next(createHttpError(500, "An error occurred during registration"));
    }
  };
}
