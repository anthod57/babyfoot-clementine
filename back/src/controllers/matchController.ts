import AbstractController from "./abstractController";
import MatchService, { CreateMatchInput } from "../services/matchService";
import { Request, Response } from "express";

class MatchController extends AbstractController {
    private readonly matchService = new MatchService();

    /**
     * Get all matches
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async getAllMatches(req: Request, res: Response): Promise<Response> {
        const matches = await this.matchService.getAllMatches();
        return this.ok(res, matches);
    }

    /**
     * Get a match by its id
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async getMatchById(req: Request, res: Response): Promise<Response> {
        const { id } = req.params as unknown as { id: number };

        const match = await this.matchService.getMatchById(id);

        if (!match) {
            return this.notFound(res, "Match not found");
        }

        return this.ok(res, match);
    }

    /**
     * Create a new match
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async createMatch(req: Request, res: Response): Promise<Response> {
        const { tournamentId, date, homeTeamId, awayTeamId, result } =
            req.body as unknown as CreateMatchInput;

        const match = await this.matchService.createMatch({
            tournamentId,
            date,
            homeTeamId,
            awayTeamId,
            result,
        });

        return this.created(res, match);
    }

    /**
     * Update a match
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async updateMatch(req: Request, res: Response): Promise<Response> {
        const { id } = req.params as unknown as { id: number };

        const { date, homeTeamId, awayTeamId, result } =
            req.body as unknown as Partial<CreateMatchInput>;

        const match = await this.matchService.updateMatch(id, {
            date,
            homeTeamId,
            awayTeamId,
            result,
        });

        return this.ok(res, match);
    }

    /**
     * Delete a match
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async deleteMatch(req: Request, res: Response): Promise<Response> {
        const { id } = req.params as unknown as { id: number };

        await this.matchService.deleteMatch(id);

        return this.noContent(res);
    }
}

export default new MatchController();
