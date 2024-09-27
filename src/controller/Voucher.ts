import { Request, Response } from "express";
import { Voucher } from "../models/Voucher";
import userModel from "../models/Users";
import { generateRandomCode, sendSuccessResponse } from "../utill/helpers";
import { ctrlrFunc } from "controllerFunc";
import createHttpError from "http-errors";

export class VoucherController {
  ////////////////////////////////////////////////////////////////////////////////////////////////

  static createVoucher: ctrlrFunc = async (req, res, next) => {
    try {
      const { cryptoType, amount } = req.body;

      let code = generateRandomCode(12);

      let codeExists = await Voucher.findOne({ code });

      while (codeExists) {
        code = generateRandomCode(12);
        codeExists = await Voucher.findOne({ code });
      }

      const newVoucher = await Voucher.create({ cryptoType, amount, code });
      return sendSuccessResponse(
        res,
        "Voucher created successfully",
        newVoucher,
        200
      );
    } catch (error) {
      next(createHttpError(500, "Error creating voucher", error));
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////

  static getAllVouchers: ctrlrFunc = async (req, res, next) => {
    try {
      const vouchers = await Voucher.find();
      return sendSuccessResponse(res, "", vouchers, 200);
    } catch (error) {
      next(createHttpError(500, "Error fetching vouchers", error));
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////

  static getVoucherById: ctrlrFunc = async (req, res, next) => {
    try {
      const { id } = req.params;
      const voucher = await Voucher.findById(id);
      if (!voucher) {
        next(createHttpError.NotFound("Voucher not found"));
        return;
      }
      return sendSuccessResponse(res, "", voucher, 200);
    } catch (error) {
      next(createHttpError(500, "Error retrieving voucher", error));
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////

  static updateVoucher: ctrlrFunc = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updatedVoucher = await Voucher.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updatedVoucher) {
        next(createHttpError.NotFound("Voucher not found"));
        return;
      }
      return sendSuccessResponse(res, "", updatedVoucher, 200);
    } catch (error) {
      next(createHttpError(500, "Error updating voucher", error));
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////

  static deleteVoucher: ctrlrFunc = async (req, res, next) => {
    try {
      const { id } = req.params;
      const deletedVoucher = await Voucher.findByIdAndDelete(id);
      if (!deletedVoucher) {
        next(createHttpError.NotFound("Voucher not found"));
        return;
      }
      return sendSuccessResponse(res, "Voucher deleted successfully", 200);
    } catch (error) {
      next(createHttpError(500, "Error deleting voucher", error));
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////

  static validateVoucherRedeem: ctrlrFunc = async (req, res, next) => {
    try {
      const { voucherId, email } = req.body;

      if (!voucherId || !email) {
        next(createHttpError.BadRequest());
        return;
      }

      const user = await userModel
        .findOne()
        .where("email")
        .equals(email)
        .where("vouchers._id")
        .equals(voucherId);

      if (user) {
        return sendSuccessResponse(res, "Validated successfully", 200);
      }

      next(createHttpError(400, "Validation Error"));

      return;
    } catch (error) {
      next(createHttpError(400, "Validation Error"));
    }
  };
}
