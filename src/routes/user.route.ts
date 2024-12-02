import { Router } from "express";
import { onManageUser } from "../controllers/users/user.controller";
import { login } from "../controllers/users/auth";
import { validate } from '../middlewares/authMiddle';

export const manageUser = Router()

manageUser.post("/login", login);

manageUser.post("/daily", validate.auth, onManageUser.doDailyAttendance);

manageUser.post("/save_streak", validate.auth, onManageUser.doSaveStreak);

manageUser.post("/check_daily", validate.auth, onManageUser.doCheckDailyAttendance);

manageUser.post("/check_yesterday", validate.auth, onManageUser.doCheckYesterdayCheckin);

manageUser.post("/doRef", validate.auth, onManageUser.doRef)

manageUser.post("/leaderboard", validate.auth, onManageUser.doGetLeaderboard);

manageUser.post("/connect_wallet", validate.auth, onManageUser.doConnectWallet);

manageUser.post("/grant", validate.auth, onManageUser.doGrantAdmin)

manageUser.post("/buy_more_quizz", validate.auth, onManageUser.doBuyMoreQuizz)

manageUser.post("/mint_body_data", validate.auth, onManageUser.doGetMintBodyData)

manageUser.post("/check_current_rank", validate.auth, onManageUser.doCheckTop10)

manageUser.post("/withdraw_ton", validate.auth, onManageUser.doWithdrawTon)