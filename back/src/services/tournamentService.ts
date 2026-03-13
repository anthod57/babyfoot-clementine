import AbstractService from "./abstractService";
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

export default class TournamentService extends AbstractService {
    /**
     * Get all tournaments
     * @returns {Promise<Tournament[]>}
     */
    public async getAllTournaments(): Promise<Tournament[]> {
        return this.findAll(Tournament);
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
            include: [{ model: Tournament, where: { id } }],
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
     * Schedule matches for a tournament
     * @param {number} tournamentId
     * @returns {Promise<Match[]>}
     */
    public async scheduleMatchesForTournament(
        tournamentId: number
    ): Promise<Match[]> {
        const matches = await this.generateRoundRobinMatchesForTournament(
            tournamentId
        );

        const promises = matches.map(async match => {
            await this.create(Match, {
                tournamentId,
                homeTeamId: match.homeTeamId,
                awayTeamId: match.awayTeamId,
                result: MatchResult.PENDING,
                date: new Date(),
            });
        });

        await Promise.all(promises);

        return this.findAll(Match, {
            where: { tournamentId },
            include: [
                { model: Team, as: "homeTeam", attributes: ["id", "name"] },
                { model: Team, as: "awayTeam", attributes: ["id", "name"] },
            ],
        }) as Promise<Match[]>;
    }

    /**
     * Get all matches of a tournament
     * @param {number} tournamentId
     * @returns {Promise<Match[]>}
     */
    public async getMatchesOfTournament(
        tournamentId: number
    ): Promise<Match[]> {
        await this.findByIdOrThrow(Tournament, tournamentId, undefined, {
            notFoundMessage: "Tournament not found",
        });
        return this.findAll(Match, {
            where: { tournamentId },
            include: [
                { model: Team, as: "homeTeam", attributes: ["id", "name"] },
                { model: Team, as: "awayTeam", attributes: ["id", "name"] },
            ],
        }) as Promise<Match[]>;
    }
}
