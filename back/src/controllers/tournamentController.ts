import AbstractController from "./abstractController";
import TournamentService, {
    CreateTournamentInput,
} from "../services/tournamentService";
import { Request, Response } from "express";

/**
 * Tournament controller class
 * Handles tournament requests
 */
class TournamentController extends AbstractController {
    private readonly tournamentService = new TournamentService();

    /**
     * Get all tournaments
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async getAllTournaments(
        req: Request,
        res: Response
    ): Promise<Response> {
        const tournaments = await this.tournamentService.getAllTournaments();
        return this.ok(res, tournaments);
    }

    /**
     * Get a tournament by its id
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async getTournamentById(
        req: Request,
        res: Response
    ): Promise<Response> {
        const { id } = req.params as unknown as { id: number };
        const tournament = await this.tournamentService.getTournamentById(id);
        if (!tournament) {
            return this.notFound(res, "Tournament not found");
        }
        return this.ok(res, tournament);
    }

    /**
     * Create a new tournament
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async createTournament(
        req: Request,
        res: Response
    ): Promise<Response> {
        const { name, description, startDate, endDate } = req.body;
        const tournament = await this.tournamentService.createTournament({
            name,
            description,
            startDate,
            endDate,
        });
        return this.created(res, tournament);
    }

    /**
     * Update a tournament
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async updateTournament(
        req: Request,
        res: Response
    ): Promise<Response> {
        const { id } = req.params as unknown as { id: number };
        const { name, description, startDate, endDate } =
            req.body as unknown as CreateTournamentInput;

        const tournament = await this.tournamentService.updateTournament(id, {
            name,
            description: description ?? "",
            startDate,
            endDate,
        });

        return this.ok(res, tournament);
    }

    /**
     * Delete a tournament
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async deleteTournament(
        req: Request,
        res: Response
    ): Promise<Response> {
        const { id } = req.params as unknown as { id: number };

        await this.tournamentService.deleteTournament(id);

        return this.noContent(res);
    }

    /**
     * Get the teams of a tournament
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async getTeamsOfTournament(
        req: Request,
        res: Response
    ): Promise<Response> {
        const { id } = req.params as unknown as { id: number };

        const teams = await this.tournamentService.getTeamsOfTournament(id);

        return this.ok(res, teams);
    }

    /**
     * Add a team to a tournament
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async addTeamToTournament(
        req: Request,
        res: Response
    ): Promise<Response> {
        const { tournamentId, teamId } = req.body as unknown as {
            tournamentId: number;
            teamId: number;
        };

        const teamTournamentParticipation =
            await this.tournamentService.addTeamToTournament(
                tournamentId,
                teamId
            );

        return this.created(res, teamTournamentParticipation);
    }

    /**
     * Remove a team from a tournament
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async removeTeamFromTournament(
        req: Request,
        res: Response
    ): Promise<Response> {
        const { tournamentId, teamId } = req.body as unknown as {
            tournamentId: number;
            teamId: number;
        };

        await this.tournamentService.removeTeamFromTournament(
            tournamentId,
            teamId
        );

        return this.noContent(res);
    }
}

export default new TournamentController();
