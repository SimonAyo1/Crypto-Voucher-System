import { NextFunction, Request, Response } from "express";
import userModel, { User } from "../models/Users";
import { sendSuccessResponse } from "../utill/helpers";
import createHttpError from "http-errors";
import { ctrlrFunc } from "controllerFunc";

export class UserController {
  ////////////////////////////////////////////////////////////////////////////////////////////////

  static async findUserById(userId: string, res: Response) {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return user;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  static getAllUsers: ctrlrFunc = async (req, res, next) => {
    try {
      const users = await userModel.find();
      return sendSuccessResponse(
        res,
        "Users retrieved successfully",
        users,
        200
      );
    } catch (error) {
      return next(createHttpError.InternalServerError(JSON.stringify(error)));
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////

  static suspendUser: ctrlrFunc = async (req, res, next) => {
    try {
      const userId = req.params.userId;

      const user = await userModel.findByIdAndUpdate(
        userId,
        { suspended: true },
        { new: true }
      );

      if (!user) {
        return next(createHttpError.NotFound());
      }

      return sendSuccessResponse(res, "User suspended successfully", {}, 200);
    } catch (error) {
      return next(createHttpError.InternalServerError(JSON.stringify(error)));
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////

  static unSuspendUser: ctrlrFunc = async (req, res, next) => {
    try {
      const userId = req.params.userId;

      const user = await userModel.findByIdAndUpdate(
        userId,
        { suspended: false },
        { new: true }
      );

      if (!user) {
        return next(createHttpError.NotFound());
      }

      return sendSuccessResponse(res, "User unsuspended successfully", {}, 200);
    } catch (error) {
      return next(createHttpError.InternalServerError(JSON.stringify(error)));
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////

  static getRedeemedVouchers: ctrlrFunc = async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      const user = await this.findUserById(userId, res);

      if (!user) return;

      const redeemedVouchers = (user as User).vouchers.filter(
        (voucher) => voucher.redeemed
      );
      return sendSuccessResponse(
        res,
        "Redeemed vouchers retrieved",
        redeemedVouchers,
        200
      );
    } catch (error) {
      return next(
        createHttpError(500, "Error retrieving redeemed vouchers", error)
      );
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////

  static getUnredeemedVouchers: ctrlrFunc = async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      const user = await this.findUserById(userId, res);

      if (!user) return;

      const redeemedVouchers = (user as User).vouchers.filter(
        (voucher) => !voucher.redeemed
      );
      return sendSuccessResponse(
        res,
        "Unredeemed vouchers retrieved",
        redeemedVouchers,
        200
      );
    } catch (error) {
      return next(
        createHttpError(500, "Error retrieving unredeemed vouchers", error)
      );
    }
  };
}
