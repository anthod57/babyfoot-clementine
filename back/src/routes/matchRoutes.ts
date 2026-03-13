import { Router } from "express";
import { validate } from "../middlewares/validate";
import matchController from "../controllers/matchController";
import {
    createMatchSchema,
    updateMatchSchema,
} from "../validators/matchValidators";
import { idParamSchema } from "../validators";
import { auth, requireRole } from "../middlewares/auth";

const router = Router();

// -- Admin only -- //
router.post(
    "/",
    auth,
    requireRole("admin"),
    validate(createMatchSchema),
    matchController.createMatch.bind(matchController)
);

router.put(
    "/:id",
    auth,
    requireRole("admin"),
    validate(idParamSchema, "params"),
    validate(updateMatchSchema),
    matchController.updateMatch.bind(matchController)
);

router.delete(
    "/:id",
    auth,
    requireRole("admin"),
    validate(idParamSchema, "params"),
    matchController.deleteMatch.bind(matchController)
);

// -- Authenticated -- //
router.get(
    "/",
    auth,
    matchController.getAllMatches.bind(matchController)
);

router.get(
    "/:id",
    auth,
    validate(idParamSchema, "params"),
    matchController.getMatchById.bind(matchController)
);

export default router;
