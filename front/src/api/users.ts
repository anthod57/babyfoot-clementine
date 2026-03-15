import { BaseApi } from "./baseApi";
import { apiFetch } from "./client";
import type { User } from "@/types/api";

export interface CreateUserPayload {
    username: string;
    name: string;
    surname: string;
    email: string;
    password: string;
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">>;

class UsersApi extends BaseApi<User, CreateUserPayload, UpdateUserPayload> {
    constructor() {
        super("/users");
    }

    /**
     * Create a new user
     * @param {CreateUserPayload} payload
     * @returns {Promise<User>}
     */
    override create(payload: CreateUserPayload): Promise<User> {
        return apiFetch<User>(this.basePath, {
            method: "POST",
            body: payload,
            public: true,
        });
    }
}

export const usersApi = new UsersApi();
