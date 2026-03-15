import { BaseApi } from "./baseApi";
import { apiFetch } from "./client";
import type { Team, User } from "@/types/api";

export interface CreateTeamPayload {
    name: string;
}

export type UpdateTeamPayload = Partial<CreateTeamPayload>;

/**
 * Teams API
 * @extends {BaseApi<Team, CreateTeamPayload, UpdateTeamPayload>}
 */
class TeamsApi extends BaseApi<Team, CreateTeamPayload, UpdateTeamPayload> {
    constructor() {
        super("/teams");
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
     * @returns {Promise<void>}
     */
    addUser(teamId: number, userId: number): Promise<void> {
        return apiFetch<void>(`${this.basePath}/${teamId}/users`, {
            method: "POST",
            body: { user_id: userId },
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
