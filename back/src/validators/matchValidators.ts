import { z } from "zod";

/** Match result: 0=Pending, 1=HomeTeamWin, 2=AwayTeamWin, 3=Draw, 4=InProgress */
export const matchResultSchema = z
    .number()
    .int()
    .min(0, "Result must be 0-4")
    .max(4, "Result must be 0-4");

const scoreSchema = z.coerce
    .number()
    .int()
    .min(0, "Score must be 0 or greater");

const matchBaseSchema = z.object({
    tournamentId: z.coerce
        .number()
        .int()
        .positive("Tournament ID must be a positive integer"),
    date: z.coerce.date(),
    homeTeamId: z.coerce
        .number()
        .int()
        .positive("Home team ID must be a positive integer"),
    awayTeamId: z.coerce
        .number()
        .int()
        .positive("Away team ID must be a positive integer"),
    homeScore: scoreSchema.default(0),
    awayScore: scoreSchema.default(0),
    result: matchResultSchema.default(0),
});

export const createMatchSchema = matchBaseSchema.refine(
    data => data.homeTeamId !== data.awayTeamId,
    {
        message: "Home team and away team must be different",
        path: ["awayTeamId"],
    }
);

export const updateMatchSchema = z
    .object({
        date: z.coerce.date().optional(),
        homeTeamId: z.coerce.number().int().positive().optional(),
        awayTeamId: z.coerce.number().int().positive().optional(),
        homeScore: scoreSchema.optional(),
        awayScore: scoreSchema.optional(),
        result: matchResultSchema.optional(),
    })
    .refine(
        data => {
            const home = data.homeTeamId;
            const away = data.awayTeamId;
            if (home !== undefined && away !== undefined) return home !== away;
            return true;
        },
        {
            message: "Home team and away team must be different",
            path: ["awayTeamId"],
        }
    );

export const getMatchesQuerySchema = z.object({
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
        .optional(),
    /** Filter by result value (0=Pending, 1=HomeWin, 2=AwayWin, 3=Draw, 4=InProgress) */
    result: z.coerce.number().int().min(0).max(4).optional(),
    /** If true, only return pending matches scheduled in the future (date > NOW()) */
    upcoming: z
        .enum(["true", "false"])
        .transform(v => v === "true")
        .optional(),
});

export type GetMatchesQuery = z.infer<typeof getMatchesQuerySchema>;
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
