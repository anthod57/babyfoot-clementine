export const MatchResult = {
    Pending: 0,
    HomeWin: 1,
    AwayWin: 2,
    Draw: 3,
    InProgress: 4,
} as const;

export type MatchResult = (typeof MatchResult)[keyof typeof MatchResult];

export interface Role {
    id: number;
    roleName: "admin" | "user";
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: number;
    username: string;
    name: string;
    surname: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    roles?: Role[];
}

export interface Team {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    users?: User[];
}

export interface Tournament {
    id: number;
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
    teams?: Team[];
    matches?: Match[];
}

export interface Match {
    id: number;
    tournamentId: number;
    date: string;
    homeTeamId: number;
    awayTeamId: number;
    homeScore: number;
    awayScore: number;
    result: MatchResult;
    createdAt: string;
    updatedAt: string;
}

export interface MatchWithTeams extends Match {
    homeTeam: Team;
    awayTeam: Team;
    tournament?: Tournament;
}

export interface TournamentWithMatches extends Tournament {
    matches: MatchWithTeams[];
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}
