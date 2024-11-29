import { Router } from "express";
import { onManageWordGame } from "../controllers/wordGame/wordGame.controller";
import { validate } from '../middlewares/authMiddle';

export const manageWordGame = Router()

manageWordGame.post("/topic", validate.auth, validate.isAdmin, onManageWordGame.doCreateTopics);

manageWordGame.post("/change_topic", validate.auth, validate.isAdmin, onManageWordGame.doChangeTopic);

manageWordGame.post("/word", validate.auth, validate.isAdmin, onManageWordGame.doCreateWords);

manageWordGame.post("/change_word", validate.auth, validate.isAdmin, onManageWordGame.doChangeWord);

manageWordGame.post("/get_game", validate.auth, onManageWordGame.getChallenge);

manageWordGame.post("/answer", validate.auth, onManageWordGame.doAnswer);

manageWordGame.post("/get_game_match_meaning", validate.auth, onManageWordGame.getGameMatchMeaning);

manageWordGame.post("/answer_match_meaning", validate.auth, onManageWordGame.doAnswerMatchMeaning);