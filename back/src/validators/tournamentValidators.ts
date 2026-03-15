import { z } from "zod";

const tournamentBaseSchema = z.object({
    name: z.string().min(1, "Name is required").max(255),
    description: z.string().max(5000).optional().nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
});

export const createTournamentSchema = tournamentBaseSchema.refine(data => data.endDate >= data.startDate, {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
});

export const updateTournamentSchema = tournamentBaseSchema.partial();

export const tournamentTeamIdsSchema = z.object({
    tournamentId: z.coerce
        .number()
        .int()
        .positive("Tournament ID must be a positive integer"),
    teamId: z.coerce
        .number()
        .int()
        .positive("Team ID must be a positive integer"),
});

export const addTeamToTournamentSchema = z.object({
    teamId: z.coerce.number().int().positive("Team ID must be a positive integer"),
});

const dateQueryField = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
    .optional();

/** Query params for GET /tournaments — pagination, search, optional date filter */
export const getTournamentsQuerySchema = z.object({
    date: dateQueryField,
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(255).optional(),
});

/** Query params for GET /tournaments/:id/matches — matches of a tournament on a given day */
export const getTournamentMatchesQuerySchema = z.object({ date: dateQueryField })

export type GetTournamentsQuery = z.infer<typeof getTournamentsQuerySchema>
export type GetTournamentMatchesQuery = z.infer<typeof getTournamentMatchesQuerySchema>
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
export type TournamentTeamIdsInput = z.infer<typeof tournamentTeamIdsSchema>;
