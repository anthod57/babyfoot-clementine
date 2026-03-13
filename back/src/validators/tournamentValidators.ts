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

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
export type TournamentTeamIdsInput = z.infer<typeof tournamentTeamIdsSchema>;
