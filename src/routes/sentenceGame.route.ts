import { Router } from "express";
import { onManageSentenceGame } from "../controllers/sentenceGame/sentenceGame.controller";
import { validate } from '../middlewares/authMiddle';

export const manageSentenceGame = Router()

manageSentenceGame.post("/", validate.auth, validate.isAdmin, onManageSentenceGame.doCreateSentence);

manageSentenceGame.get("/get_game", validate.auth, onManageSentenceGame.doGetSentenceGame);

manageSentenceGame.post("/answer", validate.auth, onManageSentenceGame.doAnswer);