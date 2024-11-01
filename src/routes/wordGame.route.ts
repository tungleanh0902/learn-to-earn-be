import { Router } from "express";
import { onManageWordGame } from "../controllers/wordGame/wordGame.controller";
import { validate } from '../middlewares/authMiddle';

export const manageWordGame = Router()

manageWordGame.post("/topic", validate.auth, validate.isAdmin, onManageWordGame.doCreateTopics);

manageWordGame.post("/change_topic", validate.auth, validate.isAdmin, onManageWordGame.doChangeTopic);

manageWordGame.post("/word", validate.auth, validate.isAdmin, onManageWordGame.doCreateWords);

manageWordGame.post("/change_word", validate.auth, validate.isAdmin, onManageWordGame.doChangeWord);

manageWordGame.get("/get_game", validate.auth, onManageWordGame.getChallenge);

manageWordGame.post("/answer", validate.auth, onManageWordGame.doAnswer);