import { Router } from "express";
import { onManageSeasonBadge } from "../controllers/seasonBadge/seasonBadge.controller";
import { validate } from '../middlewares/authMiddle';

export const manageBadge = Router()

manageBadge.post("/", validate.auth, validate.isAdmin, onManageSeasonBadge.doPublishNewSeasonBadge);

manageBadge.post("/buy_nft", validate.auth, onManageSeasonBadge.doBuyNft);

manageBadge.post("/buy_nft_kaia", validate.auth, onManageSeasonBadge.doBuyNftKaia);

manageBadge.post("/check_badge", validate.auth, onManageSeasonBadge.doCheckBoughtSeasonBadge);

manageBadge.post("/current_badge", onManageSeasonBadge.doGetCurrentBadge);