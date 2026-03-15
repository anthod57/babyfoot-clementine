import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", component: () => import("@/views/HomeView.vue") },
        {
            path: "/connexion",
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
        },
        {
            path: "/admin/teams",
            component: () => import("@/views/AdminTeamsView.vue"),
        },
        {
            path: "/admin/users",
            component: () => import("@/views/AdminUsersView.vue"),
        },
        {
            path: "/matches/:id",
            component: () => import("@/views/MatchView.vue"),
        },
    ],
});

export default router;
