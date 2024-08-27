import UserModel from "../models/Users";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response } from "express";
import { sendResponse } from "../utill/response";
import adminModel from "../models/Admin";
import userModel from "../models/Users";
dotenv.config();

class AuthController {
  Login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendResponse("Invalid email or password!", 400, false, null, res);
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return sendResponse("Invalid email or password!", 400, false, null, res);
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.toJSON().password as string
    );

    console.log(isPasswordValid, "isPasswordValid");
    if (!isPasswordValid) {
      return sendResponse(
        "Authentication failed, Wrong password!",
        400,
        false,
        null,
        res
      );
    }

    const token = jwt.sign(
      { email, userId: (user as any)._id },
      process.env.SECRET_KEY || "----",
      {
        expiresIn: "1h",
      }
    );
    res?.json({
      success: true,
      token,
      message: user,
    });
  };

  AdminLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      sendResponse("Bad request!", 400, false, null, res);
    }
    const user = await adminModel.findOne({ email });
    if (!user) {
      sendResponse("Authentication failed", 400, false, null, res);

      return;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.toJSON().password as string
    );

    if (!isPasswordValid) {
      sendResponse(
        "Authentication failed, Wrong password!",
        400,
        false,
        null,
        res
      );
      return;
    }

    const token = jwt.sign(
      { email, userId: (user as any)._id, role: "admin" },
      process.env.SECRET_KEY || "----",
      {
        expiresIn: "1h",
      }
    );
    res?.json({
      success: true,
      token,
      message: "Authentication successful",
    });
  };

  SignUp = async (req: Request, res: Response) => {
    if (!req.body?.password || !req.body?.email) {
      sendResponse("Bad request", 403, false, null, res);
      return;
    }

    const hashedPassword = await bcrypt.hash(req.body?.password, 10);

    const registerObj = {
      password: hashedPassword,
      email: req.body?.email,
    };

    try {
      const userExist = await userModel.findOne({ email: registerObj.email });
      if (userExist) {
        sendResponse("Email has been taken.", 400, false, null, res);
        return;
      }
      const user = await UserModel.create(registerObj);
      sendResponse("Registered successfully", 200, true, user, res);
    } catch (error) {
      sendResponse(error.message, 500, false, error, res);
    }
  };
}

export const authController = new AuthController();
