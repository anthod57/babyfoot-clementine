import AbstractService from "./abstractService";
import { Team } from "../models/teamModel";
import { TeamHasUser } from "../models/teamHasUserModel";
import { User } from "../models/userModel";

export type CreateTeamInput = {
    name: string;
};

export type TeamWithUsers = {
    id: number;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
    users: { id: number; fullName: string }[];
};

const TEAM_INCLUDE_USERS = {
    include: [
        {
            model: User,
            attributes: ["id", "name", "surname"],
            through: { attributes: [] },
        },
    ],
};

/**
 * Format a team with its users
 * @param {Team & { Users?: User[] }} team
 * @returns {TeamWithUsers}
 */
function formatTeamWithUsers(team: Team & { Users?: User[] }): TeamWithUsers {
    const users = (team.Users ?? []).map(u => ({
        id: u.id,
        fullName: `${u.name} ${u.surname}`.trim(),
    }));
    return {
        id: team.id,
        name: team.name,
        createdAt: team.createdAt ?? undefined,
        updatedAt: team.updatedAt ?? undefined,
        users,
    };
}

export default class TeamService extends AbstractService {
    /**
     * Get all teams
     */
    public async getAllTeams(): Promise<TeamWithUsers[]> {
        const teams = (await this.findAll(
            Team,
            TEAM_INCLUDE_USERS
        )) as (Team & { Users?: User[] })[];
        return teams.map(formatTeamWithUsers);
    }

    /**
     * Get a team by its id
     */
    public async getTeamById(id: number): Promise<TeamWithUsers | null> {
        const team = (await this.findById(Team, id, TEAM_INCLUDE_USERS)) as
            | (Team & { Users?: User[] })
            | null;
        return team ? formatTeamWithUsers(team) : null;
    }

    /**
     * Create a new team
     * @param {CreateTeamInput} team
     * @returns {Promise<Team>}
     */
    public async createTeam(team: CreateTeamInput): Promise<TeamWithUsers> {
        const created = await this.create(Team, team);
        const withUsers = (await this.findById(
            Team,
            created.id,
            TEAM_INCLUDE_USERS
        )) as Team & { Users?: User[] };
        return formatTeamWithUsers(withUsers);
    }

    /**
     * Update a team
     * @param {number} id
     * @param {CreateTeamInput} team
     * @returns {Promise<Team>}
     */
    public async updateTeam(
        id: number,
        team: CreateTeamInput
    ): Promise<TeamWithUsers> {
        await this.update(
            Team,
            team,
            { id },
            { notFoundMessage: "Team not found" }
        );
        const withUsers = (await this.findById(
            Team,
            id,
            TEAM_INCLUDE_USERS
        )) as Team & { Users?: User[] };
        return formatTeamWithUsers(withUsers);
    }

    /**
     * Delete a team
     * @param {number} id
     * @returns {Promise<number>}
     */
    public async deleteTeam(id: number): Promise<number> {
        await this.delete(
            Team,
            { id },
            {
                notFoundMessage: "Team not found",
            }
        );
        return id;
    }

    /**
     * Add a user to a team
     * @param {number} teamId
     * @param {number} userId
     * @returns {Promise<TeamWithUsers>}
     */
    public async addUserToTeam(
        teamId: number,
        userId: number
    ): Promise<TeamWithUsers> {
        await this.findByIdOrThrow(Team, teamId, undefined, {
            notFoundMessage: "Team not found",
        });
        await this.findByIdOrThrow(User, userId, undefined, {
            notFoundMessage: "User not found",
        });

        await this.create(TeamHasUser, { teamId, userId });

        const withUsers = (await this.findById(
            Team,
            teamId,
            TEAM_INCLUDE_USERS
        )) as Team & { Users?: User[] };

        return formatTeamWithUsers(withUsers);
    }

    /**
     * Remove a user from a team
     * @param {number} teamId
     * @param {number} userId
     * @returns {Promise<void>}
     */
    public async removeUserFromTeam(
        teamId: number,
        userId: number
    ): Promise<void> {
        await this.delete(
            TeamHasUser,
            { teamId, userId },
            {
                notFoundMessage: "User not found in team",
            }
        );
    }

    /**
     * Get the users of a team
     * @param {number} teamId
     * @returns {Promise<User[]>}
     */
    public async getUsersOfTeam(teamId: number): Promise<User[]> {
        return this.findAll(User, {
            include: [{ model: Team, where: { id: teamId } }],
        });
    }
}
