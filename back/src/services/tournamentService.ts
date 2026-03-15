import { Op, fn, col, where as seqWhere } from "sequelize";
import AbstractService from "./abstractService";
import { sequelize } from "../config/database";
import { Tournament } from "../models/tournamentModel";
import { Team } from "../models/teamModel";
import { Match, MatchResult } from "../models/matchModel";
import { TeamTournamentParticipation } from "../models/teamTournamentParticipationModel";
import {
    generateRoundRobinMatchPairs,
    RoundRobinMatch,
} from "../utils/roundRobinGenerator";

export type CreateTournamentInput = {
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
};

export type PaginatedTournamentsResult = {
    data: Tournament[];
    total: number;
    page: number;
    limit: number;
};

/** Serializes schedule-matches requests per tournament to prevent concurrent transactions. */
const scheduleLocks = new Map<number, Promise<Match[]>>();

export default class TournamentService extends AbstractService {
    /**
     * Get all tournaments with pagination, search and optional date filter
     */
    public async getAllTournaments(
        opts: { date?: string; page?: number; limit?: number; search?: string } = {}
    ): Promise<Tournament[] | PaginatedTournamentsResult> {
        const { date, page = 1, limit = 20, search } = opts;
        const ORDER = [["startDate", "ASC"]] as [string, string][];
        const offset = (page - 1) * limit;

        const whereConditions: unknown[] = [];

        if (date) {
            whereConditions.push(
                seqWhere(fn("DATE", col("start_date")), { [Op.lte]: date }),
                seqWhere(fn("DATE", col("end_date")), { [Op.gte]: date })
            );
        }

        if (search?.trim()) {
            const term = `%${search.trim()}%`;
            whereConditions.push({
                [Op.or]: [
                    { name: { [Op.like]: term } },
                    { description: { [Op.like]: term } },
                ],
            } as Record<string, unknown>);
        }

        const where = whereConditions.length > 0 ? { [Op.and]: whereConditions } : {};

        const { count, rows } = await Tournament.findAndCountAll({
            where,
            order: ORDER,
            limit,
            offset,
        });
        return { data: rows, total: count, page, limit };
    }

    /**
     * Get a tournament by its id
     * @param {number} id
     * @returns {Promise<Tournament | null>}
     */
    public async getTournamentById(id: number): Promise<Tournament | null> {
        return this.findById(Tournament, id);
    }

    /**
     * Create a new tournament
     * @param {Tournament} tournament
     * @returns {Promise<Tournament>}
     */
    public async createTournament(
        tournament: CreateTournamentInput
    ): Promise<Tournament> {
        return this.create(Tournament, tournament);
    }

    /**
     * Update a tournament
     * @param {number} id
     * @param {Tournament} tournament
     * @returns {Promise<Tournament>}
     */
    public async updateTournament(
        id: number,
        tournament: CreateTournamentInput
    ): Promise<Tournament> {
        return this.update(
            Tournament,
            tournament,
            { id },
            {
                notFoundMessage: "Tournament not found",
            }
        );
    }

    /**
     * Delete a tournament
     * @param {number} id
     * @returns {Promise<number>}
     */
    public async deleteTournament(id: number): Promise<number> {
        await this.delete(
            Tournament,
            { id },
            {
                notFoundMessage: "Tournament not found",
            }
        );
        return id;
    }

    /**
     * Get the teams of a tournament
     * @param {number} id
     * @returns {Promise<Team[]>}
     */
    public async getTeamsOfTournament(id: number): Promise<Team[]> {
        await this.findByIdOrThrow(Tournament, id, undefined, {
            notFoundMessage: "Tournament not found",
        });
        return this.findAll(Team, {
            include: [{ model: Tournament, as: "tournaments", where: { id } }],
        });
    }

    /**
     * Add a team to a tournament
     * @param {number} tournamentId
     * @param {number} teamId
     * @returns {Promise<TeamTournamentParticipation>}
     */
    public async addTeamToTournament(
        tournamentId: number,
        teamId: number
    ): Promise<TeamTournamentParticipation> {
        await this.findByIdOrThrow(Tournament, tournamentId, undefined, {
            notFoundMessage: "Tournament not found",
        });
        return this.create(TeamTournamentParticipation, {
            tournamentId,
            teamId,
        });
    }

    /**
     * Remove a team from a tournament
     * @param {number} tournamentId
     * @param {number} teamId
     * @returns {Promise<number>}
     */
    public async removeTeamFromTournament(
        tournamentId: number,
        teamId: number
    ): Promise<number> {
        await this.delete(
            TeamTournamentParticipation,
            {
                tournamentId,
                teamId,
            },
            { notFoundMessage: "Team participation not found" }
        );
        return teamId;
    }

    /**
     * Generate round-robin matches for a tournament: every team plays every other team exactly once.
     * @param tournamentId - Tournament ID
     * @returns Array of match fixtures (homeTeamId, awayTeamId)
     */
    public async generateRoundRobinMatchesForTournament(
        tournamentId: number
    ): Promise<RoundRobinMatch[]> {
        const teams = await this.getTeamsOfTournament(tournamentId);
        const teamIds = teams.map(t => t.id);
        return generateRoundRobinMatchPairs(teamIds, tournamentId);
    }

    /**
     * Schedule matches for a tournament. Replaces any existing matches.
     * Uses bulk insert and transaction for performance and consistency.
     * Serializes concurrent calls per tournament to prevent lock contention and stuck requests.
     * @param {number} tournamentId
     * @returns {Promise<Match[]>}
     */
    public async scheduleMatchesForTournament(
        tournamentId: number
    ): Promise<Match[]> {
        const previous = scheduleLocks.get(tournamentId) ?? Promise.resolve();
        const promise = previous
            .then(() => this.doScheduleMatchesForTournament(tournamentId))
            .finally(() => {
                if (scheduleLocks.get(tournamentId) === promise) {
                    scheduleLocks.delete(tournamentId);
                }
            });
        scheduleLocks.set(tournamentId, promise);
        return promise;
    }

    private async doScheduleMatchesForTournament(
        tournamentId: number
    ): Promise<Match[]> {
        const fixtures = await this.generateRoundRobinMatchesForTournament(
            tournamentId
        );

        return sequelize.transaction(async t => {
            await Match.destroy({
                where: { tournamentId },
                transaction: t,
            });

            if (fixtures.length === 0) return [];

            const now = new Date();
            await Match.bulkCreate(
                fixtures.map(f => ({
                    tournamentId,
                    homeTeamId: f.homeTeamId,
                    awayTeamId: f.awayTeamId,
                    homeScore: 0,
                    awayScore: 0,
                    result: MatchResult.PENDING,
                    date: now,
                })),
                { transaction: t }
            );

            return this.findAll(Match, {
                where: { tournamentId },
                include: [
                    { model: Team, as: "homeTeam", attributes: ["id", "name"] },
                    { model: Team, as: "awayTeam", attributes: ["id", "name"] },
                ],
                order: [["id", "ASC"]],
                transaction: t,
            }) as Promise<Match[]>;
        });
    }

    /**
     * Get all matches of a tournament
     * @param {number} tournamentId
     * @returns {Promise<Match[]>}
     */
    public async getMatchesOfTournament(
        tournamentId: number,
        date?: string,
    ): Promise<Match[]> {
        await this.findByIdOrThrow(Tournament, tournamentId, undefined, {
            notFoundMessage: "Tournament not found",
        })

        const where: Record<symbol | string, unknown> = { tournamentId }
        if (date) {
            // Use MySQL DATE() to compare only the date part, avoiding timezone issues
            where[Op.and] = seqWhere(fn("DATE", col("date")), date)
        }

        // Cap at 500 (round-robin 16 teams = 120, 32 teams = 496)
        return this.findAll(Match, {
            where,
            include: [
                { model: Team, as: "homeTeam", attributes: ["id", "name"] },
                { model: Team, as: "awayTeam", attributes: ["id", "name"] },
            ],
            limit: 500,
            order: [["date", "ASC"]],
        }) as Promise<Match[]>
    }
}
