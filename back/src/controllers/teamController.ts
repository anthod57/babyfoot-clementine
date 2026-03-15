import AbstractController from "./abstractController";
import TeamService, { CreateTeamInput } from "../services/teamService";
import { Request, Response } from "express";

/**
 * Team controller class
 * Handles team requests
 */
class TeamController extends AbstractController {
    private readonly teamService = new TeamService();

    /**
     * Get all teams (paginated)
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async getAllTeams(req: Request, res: Response): Promise<Response> {
        const { page, limit, search } = req.query as unknown as {
            page?: number;
            limit?: number;
            search?: string;
        };

        const result = await this.teamService.getAllTeams(
            page ?? 1,
            limit ?? 10,
            search
        );
        return this.ok(res, result);
    }

    /**
     * Get a team by its id
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async getTeamById(req: Request, res: Response): Promise<Response> {
        const { id } = req.params as unknown as { id: number };
        const team = await this.teamService.getTeamById(id);

        if (!team) {
            return this.notFound(res, "Team not found");
        }
        return this.ok(res, team);
    }

    /**
     * Create a new team
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async createTeam(req: Request, res: Response): Promise<Response> {
        const { name } = req.body;
        const team = await this.teamService.createTeam({ name });
        return this.created(res, team);
    }

    /**
     * Update a team
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async updateTeam(req: Request, res: Response): Promise<Response> {
        const { id } = req.params as unknown as { id: number };
        const { name } = req.body as unknown as CreateTeamInput;

        const team = await this.teamService.updateTeam(id, { name });
        return this.ok(res, team);
    }

    /**
     * Delete a team
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async deleteTeam(req: Request, res: Response): Promise<Response> {
        const { id } = req.params as unknown as { id: number };

        await this.teamService.deleteTeam(id);
        return this.noContent(res);
    }

    /**
     * Add a user to a team
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async addUserToTeam(req: Request, res: Response): Promise<Response> {
        const { id } = req.params as unknown as { id: number };
        const { userId } = req.body as unknown as { userId: number };

        const team = await this.teamService.addUserToTeam(id, userId);
        return this.created(res, team);
    }

    /**
     * Remove a user from a team
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async removeUserFromTeam(
        req: Request,
        res: Response
    ): Promise<Response> {
        const { id, userId } = req.params as unknown as { id: number; userId: number };

        await this.teamService.removeUserFromTeam(id, userId);
        return this.noContent(res);
    }

    /**
     * Get the users of a team
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async getUsersOfTeam(
        req: Request,
        res: Response
    ): Promise<Response> {
        const { id } = req.params as unknown as { id: number };
        const users = await this.teamService.getUsersOfTeam(id);
        return this.ok(res, users);
    }
}

export default new TeamController();
