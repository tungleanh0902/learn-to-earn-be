import { Router } from "express";
import { onManageUser } from "../controllers/users/user.controller";
import { login } from "../controllers/users/auth";
import { validate } from '../middlewares/authMiddle';

export const manageUser = Router()

manageUser.post("/login", login);

manageUser.post("/daily", validate.auth, onManageUser.doDailyAttendance);

manageUser.post("/save_streak", validate.auth, onManageUser.doSaveStreak);

manageUser.get("/check_daily", validate.auth, onManageUser.doCheckDailyAttendance);

manageUser.get("/check_yesterday", validate.auth, onManageUser.doCheckYesterdayCheckin);

manageUser.get("/doRef", validate.auth, onManageUser.doRef)

manageUser.get("/leaderboard", onManageUser.doGetLeaderboard);

manageUser.post("/grant", validate.auth, onManageUser.doGrantAdmin)