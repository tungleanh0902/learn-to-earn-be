import { Router } from "express";
import { onManageVoucher } from "../controllers/voucher/voucher.controller";
import { validate } from '../middlewares/authMiddle';

export const manageVoucher = Router()

manageVoucher.post("/", validate.auth, validate.isAdmin, onManageVoucher.doCreateVoucher);

manageVoucher.post("/change_voucher", validate.auth, validate.isAdmin, onManageVoucher.doChangeVoucher);

manageVoucher.post("/buy_voucher", validate.auth, onManageVoucher.doBuyVoucher);

manageVoucher.post("/buy_voucher_kaia", validate.auth, onManageVoucher.doBuyVoucherKaia);

manageVoucher.post("/get_vouchers", validate.auth, onManageVoucher.doGetVoucher);

manageVoucher.post("/get_available_vouchers", onManageVoucher.doGetAvailableVoucher);

manageVoucher.post("/get_voucher_ref", onManageVoucher.doGetVoucherBoughtFromRef);