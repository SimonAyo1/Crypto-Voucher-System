import UserModel from "../models/Users";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response } from "express";
import { sendResponse } from "../utill/response";
dotenv.config();

class AuthController {
  Login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      sendResponse("Bad request!", 400, false, null, res);
    }
    const user = await UserModel.findOne({ username });
    console.log(user);
    if (!user) {
      sendResponse(
        "Authentication failed, User does not exist!",
        400,
        false,
        null,
        res
      );

      return;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.toJSON().password as string
    );
    console.log(user.toJSON(), "user.toJSON()", isPasswordValid);

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
      { username, userId: (user as any).id },
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
    if (!req.body?.password || !req.body?.username) {
      sendResponse("Bad request", 403, false, null, res);
      return;
    }

    const hashedPassword = await bcrypt.hash(req.body?.password, 10);

    const registerObj = {
      password: hashedPassword,
      username: req.body?.username,
    };

    try {
      const user = await UserModel.create(registerObj);
      sendResponse("Registered successfully", 200, true, user, res);
    } catch (error) {
      sendResponse("Internal server error", 500, false, error, res);
    }
  };
}

export const authController = new AuthController();
