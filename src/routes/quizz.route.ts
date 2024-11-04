import { Router } from "express";
import { onManageLesson } from "../controllers/quizz/quizz.controller";
import { validate } from '../middlewares/authMiddle';

export const manageQuizz = Router()

manageQuizz.post("/lessons", validate.auth, validate.isAdmin, onManageLesson.doSaveLesson);

manageQuizz.post("/change_lesson", validate.auth, validate.isAdmin, onManageLesson.doChangeLesson);

manageQuizz.post("/change_question", validate.auth, validate.isAdmin, onManageLesson.doChangeQuestion);

manageQuizz.post("/change_option", validate.auth, validate.isAdmin, onManageLesson.doChangeOption);

manageQuizz.post("/add_question", validate.auth, validate.isAdmin, onManageLesson.doAddQuestion);

manageQuizz.post("/remove_lesson", validate.auth, validate.isAdmin, onManageLesson.doRemoveLesson);

manageQuizz.post("/remove_question", validate.auth, validate.isAdmin, onManageLesson.doRemoveQuestion);

manageQuizz.get("/", validate.auth, validate.isAdmin, onManageLesson.doGetAllLessons);

manageQuizz.get("/questions", validate.auth, validate.isAdmin, onManageLesson.doGetQuestionsinLesson);

manageQuizz.get("/random_lesson", validate.auth, onManageLesson.doGetRandomLesson);

manageQuizz.post("/answer", validate.auth, onManageLesson.doAnswerQuizz);

manageQuizz.get("/random_lesson_for_campaign", validate.auth, onManageLesson.doGetRandomLessonForCampaign);

manageQuizz.post("/answer_campaign", validate.auth, onManageLesson.doAnswerQuizzCampaign);