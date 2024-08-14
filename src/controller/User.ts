import { Request, Response } from "express";
import userModel from "../models/Users";
import { Voucher } from "../models/Voucher";

export class UserController {
  // Buy a voucher
  static async buyVoucher(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, voucherId } = req.body;

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const voucher = await Voucher.findById(voucherId);
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      const newVoucher = {
        code: voucher.code,
        cryptoType: voucher.cryptoType,
        amount: voucher.amount,
        redeemed: false,
        addedAt: new Date(),
      };

      user.vouchers.push(newVoucher);
      await user.save();

      return res
        .status(200)
        .json({ message: "Voucher added to user", voucher: newVoucher });
    } catch (error) {
      return res.status(500).json({ message: "Error buying voucher", error });
    }
  }

  // Get all users
  static async getAllUsers(req: Request, res: Response): Promise<Response> {
    try {
      const users = await userModel.find();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving users", error });
    }
  }

  // Suspend a user
  static async suspendUser(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      const user = await userModel.findByIdAndUpdate(
        userId,
        { suspended: true },
        { new: true }
      );
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ message: "User suspended", user });
    } catch (error) {
      return res.status(500).json({ message: "Error suspending user", error });
    }
  }

  // Unsuspend a user
  static async unsuspendUser(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      const user = await userModel.findByIdAndUpdate(
        userId,
        { suspended: false },
        { new: true }
      );
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ message: "User unsuspended", user });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error unsuspending user", error });
    }
  }

  // Get redeemed vouchers of a user
  static async getRedeemedVouchers(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { userId } = req.params;

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const redeemedVouchers = user.vouchers.filter(
        (voucher) => voucher.redeemed
      );

      return res.status(200).json(redeemedVouchers);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error retrieving redeemed vouchers", error });
    }
  }

  // Get unredeemed vouchers of a user
  static async getUnredeemedVouchers(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { userId } = req.params;

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const unredeemedVouchers = user.vouchers.filter(
        (voucher) => !voucher.redeemed
      );

      return res.status(200).json(unredeemedVouchers);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error retrieving unredeemed vouchers", error });
    }
  }

  // Redeem a voucher
  static async redeemVoucher(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, code } = req.body;

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const voucher = user.vouchers.find((voucher) => voucher.code === code);

      if (!voucher) {
        return res
          .status(404)
          .json({ message: "Customer does not have this voucher" });
      }

      if (voucher.redeemed) {
        return res.status(400).json({ message: "Voucher already redeemed" });
      }

      voucher.redeemed = true;
      await user.save();

      return res.status(200).json({ message: "Voucher redeemed", voucher });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error redeeming voucher", error });
    }
  }
}
