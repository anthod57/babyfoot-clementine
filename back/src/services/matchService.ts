import { Op, fn, col, where as seqWhere } from "sequelize";
import AbstractService from "./abstractService";
import { ValidationError } from "../middlewares/errorHandler";
import { Match, MatchResult } from "../models/matchModel";
import { Team } from "../models/teamModel";
import { Tournament } from "../models/tournamentModel";
import { User } from "../models/userModel";

export type CreateMatchInput = {
    tournamentId: number;
    date: Date;
    homeTeamId: number;
    awayTeamId: number;
    homeScore?: number;
    awayScore?: number;
    result?: MatchResult;
};

const MATCH_INCLUDE_TEAMS = {
    include: [
        {
            model: Team,
            as: "homeTeam",
            attributes: ["id", "name"],
            include: [
                {
                    model: User,
                    as: "users",
                    attributes: ["name", "surname"],
                    through: { attributes: [] },
                },
            ],
        },
        {
            model: Team,
            as: "awayTeam",
            attributes: ["id", "name"],
            include: [
                {
                    model: User,
                    as: "users",
                    attributes: ["name", "surname"],
                    through: { attributes: [] },
                },
            ],
        },
    ],
};

const MATCH_INCLUDE_WITH_TOURNAMENT = {
    include: [
        ...MATCH_INCLUDE_TEAMS.include,
        {
            model: Tournament,
            as: "tournament",
            attributes: ["id", "name"],
        },
    ],
};

export default class MatchService extends AbstractService {
    /**
     * Get all matches
     * @returns {Promise<Match[]>}
     */
    public async getAllMatches(
        filters: { date?: string; result?: number; upcoming?: boolean } = {}
    ): Promise<Match[]> {
        const { date, result, upcoming } = filters;

        // 50 results limit to avoid abuses
        const BASE_OPTIONS = {
            ...MATCH_INCLUDE_TEAMS,
            limit: 50,
            order: [["date", "ASC"]] as [string, string][],
        };

        // Build conditions as an array merged under Op.and
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conditions: any[] = [];

        if (result !== undefined) {
            conditions.push({ result });
        }

        if (date) {
            // Use MySQL DATE() to compare only the date part, avoiding timezone issues
            conditions.push(seqWhere(fn("DATE", col("date")), date));
        }

        if (upcoming) {
            // Only pending matches scheduled strictly in the future
            conditions.push({ result: MatchResult.PENDING });
            conditions.push({ date: { [Op.gt]: new Date() } });
        }

        if (!conditions.length) {
            return this.findAll(Match, BASE_OPTIONS) as Promise<Match[]>;
        }

        return this.findAll(Match, {
            ...BASE_OPTIONS,
            where: { [Op.and]: conditions },
        }) as Promise<Match[]>;
    }

    /**
     * Get a match by its id
     * @param {number} id
     * @returns {Promise<Match | null>}
     */
    public async getMatchById(id: number): Promise<Match | null> {
        return this.findById(
            Match,
            id,
            MATCH_INCLUDE_WITH_TOURNAMENT
        ) as Promise<Match | null>;
    }

    /**
     * Create a new match
     * @param {CreateMatchInput} match
     * @returns {Promise<Match>}
     */
    public async createMatch(match: CreateMatchInput): Promise<Match> {
        await this.findByIdOrThrow(Tournament, match.tournamentId, undefined, {
            notFoundMessage: "Tournament not found",
        });

        await this.findByIdOrThrow(Team, match.homeTeamId, undefined, {
            notFoundMessage: "Home team not found",
        });

        await this.findByIdOrThrow(Team, match.awayTeamId, undefined, {
            notFoundMessage: "Away team not found",
        });

        const created = await this.create(Match, {
            tournamentId: match.tournamentId,
            date: match.date,
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            homeScore: match.homeScore ?? 0,
            awayScore: match.awayScore ?? 0,
            result: match.result ?? MatchResult.PENDING,
        });

        const withTeams = await this.findById(
            Match,
            created.id,
            MATCH_INCLUDE_TEAMS
        );

        return withTeams!;
    }

    /**
     * Update a match
     * @param {number} id
     * @param {Partial<CreateMatchInput>} match
     * @returns {Promise<Match>}
     */
    public async updateMatch(
        id: number,
        match: Partial<CreateMatchInput>
    ): Promise<Match> {
        const existing = await this.findByIdOrThrow(Match, id, undefined, {
            notFoundMessage: "Match not found",
        });

        if (match.homeTeamId !== undefined) {
            await this.findByIdOrThrow(Team, match.homeTeamId, undefined, {
                notFoundMessage: "Home team not found",
            });
        }

        if (match.awayTeamId !== undefined) {
            await this.findByIdOrThrow(Team, match.awayTeamId, undefined, {
                notFoundMessage: "Away team not found",
            });
        }

        // Make sure home team and away team are different
        if (
            match.homeTeamId !== undefined &&
            match.awayTeamId !== undefined &&
            match.homeTeamId === match.awayTeamId
        ) {
            throw new ValidationError(
                "Home team and away team must be different"
            );
        }

        const homeTeamId = match.homeTeamId ?? existing.homeTeamId;
        const awayTeamId = match.awayTeamId ?? existing.awayTeamId;

        if (homeTeamId === awayTeamId) {
            throw new ValidationError(
                "Home team and away team must be different"
            );
        }

        const updateData: Partial<Match> = {};

        if (match.date !== undefined) updateData.date = match.date;
        if (match.homeTeamId !== undefined)
            updateData.homeTeamId = match.homeTeamId;
        if (match.awayTeamId !== undefined)
            updateData.awayTeamId = match.awayTeamId;

        // If homeScore is provided
        if (match.homeScore !== undefined)
            updateData.homeScore = match.homeScore;
        if (match.awayScore !== undefined)
            updateData.awayScore = match.awayScore;
        if (match.result !== undefined) updateData.result = match.result;

        await this.update(
            Match,
            updateData,
            { id },
            {
                notFoundMessage: "Match not found",
            }
        );

        const withTeams = await this.findById(Match, id, MATCH_INCLUDE_TEAMS);

        return withTeams!;
    }

    /**
     * Delete a match
     * @param {number} id
     * @returns {Promise<number>}
     */
    public async deleteMatch(id: number): Promise<number> {
        await this.delete(
            Match,
            { id },
            {
                notFoundMessage: "Match not found",
            }
        );
        return id;
    }
}
