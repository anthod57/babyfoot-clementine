import { z } from "zod";

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, "ID must be a positive integer").transform(Number),
});

export const createUserSchema = z.object({
    username: z.string().min(1, "Username is required").max(255),
    name: z.string().min(1, "Name is required").max(255),
    surname: z.string().min(1, "Surname is required").max(255),
    email: z.string().email("Invalid email").max(255),
    password: z.string().min(8, "Password must be at least 8 characters").max(255),
});

export const updateUserSchema = createUserSchema.partial();

export const updateUserRolesSchema = z.object({
    roleIds: z.array(z.number().int().positive()).min(1, "At least one role is required"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserRolesInput = z.infer<typeof updateUserRolesSchema>;
