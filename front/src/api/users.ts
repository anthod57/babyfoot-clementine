import { BaseApi } from "./baseApi";
import type { User } from "@/types/api";

export interface CreateUserPayload {
    username: string;
    name: string;
    surname: string;
    email: string;
    password: string;
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">> & {
    password?: string;
};

class UsersApi extends BaseApi<User, CreateUserPayload, UpdateUserPayload> {
    constructor() {
        super("/users");
    }
}

export const usersApi = new UsersApi();
