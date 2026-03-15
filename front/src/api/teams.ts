import { BaseApi } from "./baseApi";
import { apiFetch, toQueryString } from "./client";
import type { Team, User } from "@/types/api";

export interface CreateTeamPayload {
    name: string;
}

export type UpdateTeamPayload = Partial<CreateTeamPayload>;

export interface PaginatedTeamsResponse {
    data: Team[];
    total: number;
    page: number;
    limit: number;
}

export interface GetTeamsParams {
    page?: number;
    limit?: number;
    search?: string;
    signal?: AbortSignal;
}

/**
 * Teams API
 * @extends {BaseApi<Team, CreateTeamPayload, UpdateTeamPayload>}
 */
class TeamsApi extends BaseApi<Team, CreateTeamPayload, UpdateTeamPayload> {
    constructor() {
        super("/teams");
    }

    /**
     * Fetches teams with pagination and optional search.
     * @param {GetTeamsParams} [params]
     * @returns {Promise<PaginatedTeamsResponse>}
     */
    getAllPaginated(
        params: GetTeamsParams = {}
    ): Promise<PaginatedTeamsResponse> {
        const { signal, ...rest } = params;
        const qs = toQueryString(rest);
        return apiFetch<PaginatedTeamsResponse>(`${this.basePath}${qs}`, {
            signal,
        });
    }

    /**
     * Get all users of a team
     * @param {number} teamId
     * @returns {Promise<User[]>}
     */
    getUsers(teamId: number): Promise<User[]> {
        return apiFetch<User[]>(`${this.basePath}/${teamId}/users`);
    }

    /**
     * Add a user to a team
     * @param {number} teamId
     * @param {number} userId
     * @returns {Promise<Team>}
     */
    addUser(teamId: number, userId: number): Promise<Team> {
        return apiFetch<Team>(`${this.basePath}/${teamId}/users`, {
            method: "POST",
            body: { userId },
        });
    }

    /**
     * Remove a user from a team
     * @param {number} teamId
     * @param {number} userId
     * @returns {Promise<void>}
     */
    removeUser(teamId: number, userId: number): Promise<void> {
        return apiFetch<void>(`${this.basePath}/${teamId}/users/${userId}`, {
            method: "DELETE",
        });
    }
}

export const teamsApi = new TeamsApi();
