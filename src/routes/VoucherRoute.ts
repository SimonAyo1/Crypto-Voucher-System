import { Router } from "express";
import { VoucherController } from "../controller/Voucher";

const voucherRoutes = Router();

voucherRoutes.post("/vouchers", VoucherController.createVoucher);
voucherRoutes.get("/vouchers", VoucherController.getAllVouchers);
voucherRoutes.get("/vouchers/:id", VoucherController.getVoucherById);
voucherRoutes.put("/vouchers/:id", VoucherController.updateVoucher);
voucherRoutes.delete("/vouchers/:id", VoucherController.deleteVoucher);

export default voucherRoutes;
