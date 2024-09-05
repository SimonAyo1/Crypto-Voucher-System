import { Request, Response } from "express";
import { Voucher } from "../models/Voucher";
import userModel from "../models/Users";
import { generateRandomCode } from "../utill/helpers";

export class VoucherController {
  static async createVoucher(req: Request, res: Response): Promise<Response> {
    try {
      const { cryptoType, amount } = req.body;

      let code = generateRandomCode(12);

      let codeExists = await Voucher.findOne({ code });

      while (codeExists) {
        code = generateRandomCode(12);
        codeExists = await Voucher.findOne({ code });
      }

      const newVoucher = await Voucher.create({ cryptoType, amount, code });
      return res.status(201).json(newVoucher);
    } catch (error) {
      return res.status(500).json({ message: "Error creating voucher", error });
    }
  }
  
  static async getAllVouchers(req: Request, res: Response): Promise<Response> {
    try {
      const vouchers = await Voucher.find();
      return res.status(200).json(vouchers);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error retrieving vouchers", error });
    }
  }

  static async getVoucherById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const voucher = await Voucher.findById(id);
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
      return res.status(200).json(voucher);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error retrieving voucher", error });
    }
  }

  static async updateVoucher(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updatedVoucher = await Voucher.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updatedVoucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
      return res.status(200).json(updatedVoucher);
    } catch (error) {
      return res.status(500).json({ message: "Error updating voucher", error });
    }
  }

  // Delete a voucher by ID
  static async deleteVoucher(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deletedVoucher = await Voucher.findByIdAndDelete(id);
      if (!deletedVoucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
      return res.status(200).json({ message: "Voucher deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting voucher", error });
    }
  }

  static async validateVoucherRedeem(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { voucherId, email } = req.body;

      if (!voucherId || !email) {
        return res
          .status(400)
          .json({ message: "Voucher ID and email are required" });
      }

      const user = await userModel
        .findOne()
        .where("email")
        .equals(email)
        .where("vouchers._id")
        .equals(voucherId);

      if (user) {
        return res.status(200).json({ message: "Validated successfully" });
      }

      return res.status(400).json({ message: "Validation Error" });
    } catch (error) {
      return res.status(400).json({ message: "Validation Error" });
    }
  }
}
