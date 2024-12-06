import { Router } from "express";
import { onManageTracking } from "../controllers/tracking/tracking.controller";
import { validate } from '../middlewares/authMiddle';

export const manageTracking = Router()

manageTracking.post("/dau", validate.auth, validate.isAdmin, onManageTracking.doGetDAU);

manageTracking.post("/mau", validate.auth, validate.isAdmin, onManageTracking.doGetMAU);