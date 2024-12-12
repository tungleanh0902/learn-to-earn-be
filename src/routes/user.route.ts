import { Router } from "express";
import { onManageUser } from "../controllers/users/user.controller";
import { login, loginEvm } from "../controllers/users/auth";
import { validate } from '../middlewares/authMiddle';

export const manageUser = Router()

manageUser.post("/login", login);

manageUser.post("/login_evm", loginEvm);

manageUser.post("/daily", validate.auth, onManageUser.doDailyAttendance);

manageUser.post("/user_info", validate.auth, onManageUser.doGetUserInfo);

manageUser.post("/save_streak", validate.auth, onManageUser.doSaveStreak);

manageUser.post("/save_streak_kaia", validate.auth, onManageUser.doSaveStreakKaia);

manageUser.post("/check_daily", validate.auth, onManageUser.doCheckDailyAttendance);

manageUser.post("/check_yesterday", validate.auth, onManageUser.doCheckYesterdayCheckin);

manageUser.post("/doRef", validate.auth, onManageUser.doRef)

manageUser.post("/leaderboard", validate.auth, onManageUser.doGetLeaderboard);

manageUser.post("/connect_wallet", validate.auth, onManageUser.doConnectWallet);

manageUser.post("/connect_evm_wallet", validate.auth, onManageUser.doConnectEvmWallet);

manageUser.post("/grant", validate.auth, onManageUser.doGrantAdmin)

manageUser.post("/buy_more_quizz", validate.auth, onManageUser.doBuyMoreQuizz)

manageUser.post("/buy_more_quizz_kaia", validate.auth, onManageUser.doBuyMoreQuizzKaia)

manageUser.post("/mint_body_data", validate.auth, onManageUser.doGetMintBodyData)

manageUser.post("/check_current_rank", validate.auth, onManageUser.doCheckTop10)

manageUser.post("/withdraw_ton", validate.auth, onManageUser.doWithdrawTon)