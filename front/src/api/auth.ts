import { apiFetch, tokenStore } from "./client";
import type { AuthResponse, LoginPayload, User } from "@/types/api";

const USER_KEY = "auth_user";

/**
 * Reads user from localStorage.
 * @returns {User | null}
 */
function getUserFromStorage(): User | null {
    try {
        const s = localStorage.getItem(USER_KEY);
        return s ? (JSON.parse(s) as User) : null;
    } catch {
        return null;
    }
}

/**
 * Writes user to localStorage or removes it.
 * @param {User | null} user
 * @returns {void}
 */
function setUserInStorage(user: User | null): void {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
}

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
        setUserInStorage(response.user);
        return response;
    }

    /**
     * Logout an user
     * @returns {void}
     */
    public logout(): void {
        tokenStore.clear();
        setUserInStorage(null);
    }

    /**
     * Check if the user is authenticated
     * @returns {boolean}
     */
    public isAuthenticated(): boolean {
        return tokenStore.get() !== null;
    }

    /**
     * Get the current user (stored on login)
     * @returns {User | null}
     */
    public getCurrentUser(): User | null {
        if (!tokenStore.get()) {
            setUserInStorage(null);
            return null;
        }
        return getUserFromStorage();
    }
}

export const authApi = new AuthApi();
