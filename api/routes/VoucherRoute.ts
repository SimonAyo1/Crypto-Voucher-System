import { Router } from "express";
import { VoucherController } from "../controller/Voucher";
import { adminProtect } from "../middlewares/guardRoute";

const voucherRoutes = Router();

voucherRoutes.post("/vouchers", adminProtect, VoucherController.createVoucher);
voucherRoutes.get("/vouchers", VoucherController.getAllVouchers);
voucherRoutes.get("/vouchers/:id", VoucherController.getVoucherById);
voucherRoutes.put("/vouchers/:id", adminProtect, VoucherController.updateVoucher);
voucherRoutes.delete("/vouchers/:id", adminProtect, VoucherController.deleteVoucher);

export default voucherRoutes;
