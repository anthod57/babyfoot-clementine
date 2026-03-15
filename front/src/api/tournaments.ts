import { BaseApi } from "./baseApi";
import { apiFetch, toQueryString } from "./client";
import type { RequestOptions } from "./client";
import type {
    Tournament,
    TournamentWithMatches,
    Match,
    Team,
    MatchWithTeams,
} from "@/types/api";

export interface CreateTournamentPayload {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
}

export type UpdateTournamentPayload = Partial<CreateTournamentPayload>;

export interface TournamentFilters {
    date?: string;
    signal?: AbortSignal;
}

export interface GetTournamentsParams {
    page?: number;
    limit?: number;
    search?: string;
    date?: string;
    signal?: AbortSignal;
}

export interface PaginatedTournamentsResponse {
    data: Tournament[];
    total: number;
    page: number;
    limit: number;
}

/**
 * Tournaments API
 * @extends {BaseApi<Tournament, CreateTournamentPayload, UpdateTournamentPayload>}
 */
class TournamentsApi extends BaseApi<
    Tournament,
    CreateTournamentPayload,
    UpdateTournamentPayload
> {
    constructor() {
        super("/tournaments");
    }

    /**
     * Get all tournaments (paginated)
     * @param {GetTournamentsParams} params
     * @returns {Promise<PaginatedTournamentsResponse>}
     */
    getAllPaginated(
        params: GetTournamentsParams = {}
    ): Promise<PaginatedTournamentsResponse> {
        const { signal, ...rest } = params;
        const qs = toQueryString(rest);
        return apiFetch<PaginatedTournamentsResponse>(`${this.basePath}${qs}`, {
            signal,
        });
    }

    /**
     * Get all tournaments (simple list, uses date filter only - for backward compat)
     * @param {TournamentFilters} filters
     * @returns {Promise<Tournament[]>}
     */
    getAll(filters: TournamentFilters = {}): Promise<Tournament[]> {
        const { signal, ...params } = filters;
        const qs = toQueryString(params);
        return apiFetch<PaginatedTournamentsResponse>(`${this.basePath}${qs}`, {
            signal,
        }).then(res => res.data);
    }

    /**
     * Get a tournament by its id
     * @param {number} id
     * @param {RequestOptions} options
     * @returns {Promise<TournamentWithMatches>}
     */
    getById(
        id: number,
        options?: RequestOptions
    ): Promise<TournamentWithMatches> {
        return apiFetch<TournamentWithMatches>(
            `${this.basePath}/${id}`,
            options
        );
    }

    /**
     * Get all teams of a tournament
     * @param {number} id
     * @param {RequestOptions} options
     * @returns {Promise<Team[]>}
     */
    getTeams(id: number, options?: RequestOptions): Promise<Team[]> {
        return apiFetch<Team[]>(`${this.basePath}/${id}/teams`, options);
    }

    /**
     * Get all matches of a tournament
     * @param {number} id
     * @param {TournamentFilters} filters
     * @returns {Promise<MatchWithTeams[]>}
     */
    getMatches(
        id: number,
        filters: { date?: string; signal?: AbortSignal } = {}
    ): Promise<MatchWithTeams[]> {
        const { signal, ...params } = filters;
        const qs = toQueryString(params);
        return apiFetch<MatchWithTeams[]>(
            `${this.basePath}/${id}/matches${qs}`,
            { signal }
        );
    }

    /**
     * Add a team to a tournament
     * @param {number} tournamentId
     * @param {number} teamId
     * @returns {Promise<void>}
     */
    addTeam(tournamentId: number, teamId: number): Promise<void> {
        return apiFetch<void>(`${this.basePath}/${tournamentId}/teams`, {
            method: "POST",
            body: { teamId },
        });
    }

    /**
     * Remove a team from a tournament
     * @param {number} tournamentId
     * @param {number} teamId
     * @returns {Promise<void>}
     */
    removeTeam(tournamentId: number, teamId: number): Promise<void> {
        return apiFetch<void>(
            `${this.basePath}/${tournamentId}/teams/${teamId}`,
            { method: "DELETE" }
        );
    }

    /**
     * Schedule matches for a tournament
     * @param {number} id
     * @returns {Promise<Match[]>}
     */
    scheduleMatches(id: number): Promise<Match[]> {
        return apiFetch<Match[]>(`${this.basePath}/${id}/schedule-matches`, {
            method: "POST",
        });
    }
}

export const tournamentsApi = new TournamentsApi();
