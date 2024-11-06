import { Router } from "express";
import { onManageSocialTask } from "../controllers/socialTask/socialTask.controller";
import { validate } from '../middlewares/authMiddle';

export const manageSocialTask = Router()

manageSocialTask.post("/", validate.auth, validate.isAdmin, onManageSocialTask.doCreateSocialTasks);

manageSocialTask.post("/change", validate.auth, validate.isAdmin, onManageSocialTask.doChangeSocialTask);

manageSocialTask.post("/claim", validate.auth, onManageSocialTask.doClaimSocialTask);

manageSocialTask.get("/all", validate.auth, validate.isAdmin, onManageSocialTask.doGetAllTasks);

manageSocialTask.post("/all_active", validate.auth, onManageSocialTask.doGetAllActiveTasks);
