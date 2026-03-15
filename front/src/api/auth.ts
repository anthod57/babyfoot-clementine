import { apiFetch, tokenStore } from "./client";
import type { AuthResponse, LoginPayload, User } from "@/types/api";

class AuthApi {
    /**
     * Login an user
     * @param {LoginPayload} payload
     * @returns {Promise<AuthResponse>}
     */
    public async login(payload: LoginPayload): Promise<AuthResponse> {
        const response = await apiFetch<AuthResponse>("/auth/login", {
            method: "POST",
            body: payload,
            public: true,
        });
        tokenStore.set(response.token);
        return response;
    }

    /**
     * Logout an user
     * @returns {void}
     */
    public logout(): void {
        tokenStore.clear();
    }

    /**
     * Check if the user is authenticated
     * @returns {boolean}
     */
    public isAuthenticated(): boolean {
        return tokenStore.get() !== null;
    }

    /**
     * Get the current user
     * @returns {User | null}
     */
    public getCurrentUser(): User | null {
        const token = tokenStore.get();
        if (!token) return null;

        // Decode the JWT
        try {
            return JSON.parse(atob(token.split(".")[1]!)) as User;
        } catch {
            return null;
        }
    }
}

export const authApi = new AuthApi();
