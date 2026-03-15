import { Router } from "express";
import { validate } from "../middlewares/validate";
import teamController from "../controllers/teamController";
import {
    createTeamSchema,
    updateTeamSchema,
    addUserToTeamSchema,
    teamUserIdParamSchema,
    getTeamsQuerySchema,
} from "../validators/teamValidators";
import { idParamSchema } from "../validators";
import { auth, requireRole } from "../middlewares/auth";

const router = Router();

// -- Admin only -- //
router.post(
    "/",
    auth,
    requireRole("admin"),
    validate(createTeamSchema),
    teamController.createTeam.bind(teamController)
);

router.put(
    "/:id",
    auth,
    requireRole("admin"),
    validate(updateTeamSchema),
    teamController.updateTeam.bind(teamController)
);

router.delete(
    "/:id",
    auth,
    requireRole("admin"),
    teamController.deleteTeam.bind(teamController)
);

router.post(
    "/:id/users",
    auth,
    requireRole("admin"),
    validate(idParamSchema, "params"),
    validate(addUserToTeamSchema),
    teamController.addUserToTeam.bind(teamController)
);

router.delete(
    "/:id/users/:userId",
    auth,
    requireRole("admin"),
    validate(teamUserIdParamSchema, "params"),
    teamController.removeUserFromTeam.bind(teamController)
);

// -- Public -- //
router.get(
    "/",
    validate(getTeamsQuerySchema, "query"),
    teamController.getAllTeams.bind(teamController)
);

router.get("/:id", teamController.getTeamById.bind(teamController));

router.get("/:id/users", teamController.getUsersOfTeam.bind(teamController));

export default router;
