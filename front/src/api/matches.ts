import { BaseApi } from "./baseApi";
import { apiFetch, toQueryString } from "./client";
import type { RequestOptions } from "./client";
import type { Match, MatchWithTeams } from "@/types/api";

export interface CreateMatchPayload {
    tournamentId: number;
    homeTeamId: number;
    awayTeamId: number;
    date: string;
    homeScore?: number;
    awayScore?: number;
    result?: number;
}

export interface UpdateMatchPayload {
    homeTeamId?: number;
    awayTeamId?: number;
    homeScore?: number;
    awayScore?: number;
    result?: number;
    date?: string;
}

export interface MatchFilters {
    /** Filter matches by day — format: YYYY-MM-DD */
    date?: string;
    /** Filter by result value (0=Pending, 1=HomeWin, 2=AwayWin, 3=Draw, 4=InProgress) */
    result?: number;
    /** If true, only return pending matches scheduled in the future */
    upcoming?: boolean;
    signal?: AbortSignal;
}

/**
 * Matches API
 * @extends {BaseApi<Match, CreateMatchPayload, UpdateMatchPayload>}
 */
export class MatchesApi extends BaseApi<
    Match,
    CreateMatchPayload,
    UpdateMatchPayload
> {
    constructor() {
        super("/matches");
    }

    /**
     * Get all matches
     * @param {MatchFilters} filters
     * @returns {Promise<MatchWithTeams[]>}
     */
    getAll(filters: MatchFilters = {}): Promise<MatchWithTeams[]> {
        const { signal, ...params } = filters;
        const qs = toQueryString(params);
        return apiFetch<MatchWithTeams[]>(`${this.basePath}${qs}`, { signal });
    }

    /**
     * Get a match by its id
     * @param {number} id
     * @param {RequestOptions} options
     * @returns {Promise<MatchWithTeams>}
     */
    getById(id: number, options?: RequestOptions): Promise<MatchWithTeams> {
        return apiFetch<MatchWithTeams>(`${this.basePath}/${id}`, options);
    }
}

export const matchesApi = new MatchesApi();
