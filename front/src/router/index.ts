import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/composables/useAuthStore";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", component: () => import("@/views/HomeView.vue") },
        {
            path: "/login",
            component: () => import("@/views/LoginView.vue"),
        },
        {
            path: "/tournaments",
            component: () => import("@/views/TournamentsView.vue"),
        },
        {
            path: "/tournaments/:id",
            component: () => import("@/views/TournamentView.vue"),
        },
        {
            path: "/admin/tournaments",
            component: () => import("@/views/AdminTournamentsView.vue"),
            meta: { requiresAdmin: true },
        },
        {
            path: "/admin/teams",
            component: () => import("@/views/AdminTeamsView.vue"),
            meta: { requiresAdmin: true },
        },
        {
            path: "/admin/users",
            component: () => import("@/views/AdminUsersView.vue"),
            meta: { requiresAdmin: true },
        },
        {
            path: "/matches/:id",
            component: () => import("@/views/MatchView.vue"),
        },
    ],
});

router.beforeEach(to => {
    if (!to.meta.requiresAdmin) return;

    const { isAuthenticated, isAdmin } = useAuthStore();

    if (!isAuthenticated.value) {
        return { path: "/login", query: { redirect: to.fullPath } };
    }

    if (!isAdmin.value) {
        return { path: "/" };
    }
});

export default router;
