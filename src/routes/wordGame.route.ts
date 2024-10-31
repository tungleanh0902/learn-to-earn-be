import { Router } from "express";
import { onManageWordGame } from "../controllers/wordGame/wordGame.controller";
import { validate } from '../middlewares/authMiddle';

export const manageWordGame = Router()

manageWordGame.post("/topic", validate.auth, validate.isAdmin, onManageWordGame.doCreateTopics);

manageWordGame.post("/word", validate.auth, validate.isAdmin, onManageWordGame.doCreateWords);

manageWordGame.get("/get_game", validate.auth, onManageWordGame.getChallenge);

manageWordGame.post("/answer", validate.auth, onManageWordGame.doAnswer);