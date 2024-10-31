import { Router } from "express";
import { onManageSeasonBadge } from "../controllers/seasonBadge/seasonBadge.controller";
import { validate } from '../middlewares/authMiddle';

export const manageBadge = Router()

manageBadge.post("/", validate.auth, validate.isAdmin, onManageSeasonBadge.doPublishNewSeasonBadge);

manageBadge.post("/buy_nft", validate.auth, onManageSeasonBadge.doBuyNft);

manageBadge.get("/check_badge", validate.auth, onManageSeasonBadge.doCheckBoughtSeasonBadge);

manageBadge.get("/current_badge", onManageSeasonBadge.doGetCurrentBadge);