import { Router } from "express";
import { onManageUser } from "../controllers/users/user.controller";
import { login } from "../controllers/users/auth";
import { validate } from '../middlewares/authMiddle';

export const manageUser = Router()

manageUser.post("/login", login);

manageUser.post("/daily", validate.auth, validate.isAdmin, onManageUser.doDailyAttendance);

manageUser.get("/check_daily", validate.auth, onManageUser.doCheckDailyAttendance);

manageUser.get("/user_info", validate.auth, onManageUser.doGetUserInfo);

manageUser.post("/leaderboard", onManageUser.doGetLeaderboard);