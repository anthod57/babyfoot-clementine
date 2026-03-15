import { ref, readonly, computed } from "vue";
import { authApi } from "@/api";
import type { User } from "@/types/api";

const user = ref<User | null>(authApi.getCurrentUser());

/**
 * Checks if the user has the admin role.
 * @param {User | null} u
 * @returns {boolean}
 */
function hasAdminRole(u: User | null): boolean {
    if (!u?.roles?.length) return false;

    const roles = u.roles as unknown[];

    return roles.some(
        r =>
            (typeof r === "string"
                ? r
                : (r as { roleName?: string }).roleName) === "admin"
    );
}

/**
 * Auth state and helpers (user, logout, admin check).
 * @returns {object}
 */
export function useAuthStore() {
    return {
        user: readonly(user),
        isAuthenticated: computed(() => user.value !== null),
        isAdmin: computed(() => hasAdminRole(user.value)),
        initials: computed(() => {
            const u = user.value;

            if (!u) return "";

            const n = (u.name ?? "").trim();
            const s = (u.surname ?? "").trim();

            if (n && s) return `${n[0]}${s[0]}`.toUpperCase();
            if (u.email) return u.email.slice(0, 2).toUpperCase();

            return "?";
        }),
        setUser(u: User | null) {
            user.value = u;
        },
        logout() {
            authApi.logout();
            user.value = null;
        },
    };
}
