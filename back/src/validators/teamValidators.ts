import { z } from "zod";

const teamBaseSchema = z.object({
    name: z.string().min(1, "Name is required").max(255),
});

export const createTeamSchema = teamBaseSchema;

export const updateTeamSchema = teamBaseSchema.partial();

export const addUserToTeamSchema = z.object({
    userId: z.coerce
        .number()
        .int()
        .positive("User ID must be a positive integer"),
});

export const teamUserIdParamSchema = z.object({
    id: z.coerce.number().int().positive("Team ID must be a positive integer"),
    userId: z.coerce
        .number()
        .int()
        .positive("User ID must be a positive integer"),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddUserToTeamInput = z.infer<typeof addUserToTeamSchema>;
