import { Router } from "express";
import { onManageTracking } from "../controllers/tracking/tracking.controller";
import { validate } from '../middlewares/authMiddle';

export const manageTracking = Router()

manageTracking.post("/dau", onManageTracking.doGetDAU);

manageTracking.post("/mau", onManageTracking.doGetMAU);

manageTracking.post("/quizz_by_day", onManageTracking.doGetDailyAnswerQuizz);

manageTracking.post("/quizz_by_hour", onManageTracking.doGetHourlyAnswerQuizz);

manageTracking.post("/drop_game_by_day", onManageTracking.doGetDailyDropGame);

manageTracking.post("/drop_game_by_hour", onManageTracking.doGetHourlyDropGame);

manageTracking.post("/mean_matching_by_day", onManageTracking.doGetDailyMatchMeaning);

manageTracking.post("/mean_matching_by_hour", onManageTracking.doGetHourlyMatchMeaning);

manageTracking.post("/cv_submit", onManageTracking.doGetCvSubmit);

manageTracking.post("/cv_profile", onManageTracking.doGetAllCv);