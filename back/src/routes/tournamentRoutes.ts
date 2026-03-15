import { Router } from "express";
import { validate } from "../middlewares/validate";
import tournamentController from "../controllers/tournamentController";
import {
    createTournamentSchema,
    updateTournamentSchema,
    getTournamentsQuerySchema,
    getTournamentMatchesQuerySchema,
    addTeamToTournamentSchema,
} from "../validators/tournamentValidators";
import { idParamSchema } from "../validators";
import { auth, requireRole } from "../middlewares/auth";

const router = Router();

// -- Admin only -- //
router.post(
    "/",
    auth,
    requireRole("admin"),
    validate(createTournamentSchema),
    tournamentController.createTournament.bind(tournamentController)
);

router.put(
    "/:id",
    auth,
    requireRole("admin"),
    validate(updateTournamentSchema),
    tournamentController.updateTournament.bind(tournamentController)
);

router.delete(
    "/:id",
    auth,
    requireRole("admin"),
    tournamentController.deleteTournament.bind(tournamentController)
);

router.post(
    "/:id/teams",
    auth,
    requireRole("admin"),
    validate(addTeamToTournamentSchema),
    tournamentController.addTeamToTournament.bind(tournamentController)
);

router.delete(
    "/:id/teams/:teamId",
    auth,
    requireRole("admin"),
    tournamentController.removeTeamFromTournament.bind(tournamentController)
);

router.post(
    "/:id/schedule-matches",
    auth,
    requireRole("admin"),
    tournamentController.scheduleMatchesForTournament.bind(tournamentController)
);

// -- Public -- //
router.get(
    "/",
    validate(getTournamentsQuerySchema, "query"),
    tournamentController.getAllTournaments.bind(tournamentController)
);

router.get(
    "/:id",
    tournamentController.getTournamentById.bind(tournamentController)
);

router.get(
    "/:id/teams",
    tournamentController.getTeamsOfTournament.bind(tournamentController)
);

router.get(
    "/:id/matches",
    validate(idParamSchema, "params"),
    validate(getTournamentMatchesQuerySchema, "query"),
    tournamentController.getMatchesOfTournament.bind(tournamentController)
);

export default router;
