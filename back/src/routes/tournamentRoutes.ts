import { Router } from "express";
import { validate } from "../middlewares/validate";
import tournamentController from "../controllers/tournamentController";
import {
    createTournamentSchema,
    updateTournamentSchema,
} from "../validators/tournamentValidators";
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
    tournamentController.addTeamToTournament.bind(tournamentController)
);

router.delete(
    "/:id/teams/:teamId",
    auth,
    requireRole("admin"),
    tournamentController.removeTeamFromTournament.bind(tournamentController)
);

// -- Public -- //
router.get(
    "/",
    auth,
    tournamentController.getAllTournaments.bind(tournamentController)
);

router.get(
    "/:id",
    auth,
    tournamentController.getTournamentById.bind(tournamentController)
);

router.get(
    "/:id/teams",
    auth,
    tournamentController.getTeamsOfTournament.bind(tournamentController)
);

export default router;
