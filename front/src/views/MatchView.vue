<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { RouterLink } from "vue-router";
import BackLink from "@/components/common/BackLink.vue";
import { useQuery } from "@/composables/useQuery";
import { matchesApi } from "@/api";
import { MatchResult } from "@/types/api";
import { formatDate, formatTime } from "@/utils/date";

const route = useRoute();
const id = Number(route.params.id);

const {
    data: match,
    isPending,
    error,
} = useQuery(signal => matchesApi.getById(id, { signal }));

/** Libellé et style du statut du match (en cours, victoire, nul, à venir). */
const resultLabel = computed(() => {
    if (!match.value) return null;
    switch (match.value.result) {
        case MatchResult.InProgress:
            return {
                text: "En cours",
                color: "bg-blue-100 text-blue-700",
                live: true,
            };
        case MatchResult.HomeWin:
            return {
                text: "Victoire domicile",
                color: "bg-emerald-100 text-emerald-700",
                live: false,
            };
        case MatchResult.AwayWin:
            return {
                text: "Victoire extérieur",
                color: "bg-emerald-100 text-emerald-700",
                live: false,
            };
        case MatchResult.Draw:
            return {
                text: "Match nul",
                color: "bg-amber-100 text-amber-700",
                live: false,
            };
        default:
            return {
                text: "À venir",
                color: "bg-gray-100 text-gray-500",
                live: false,
            };
    }
});

/**
 * Classes CSS pour l'équipe domicile ou extérieure selon le résultat.
 * @param {"home" | "away"} side
 * @returns {string}
 */
function teamClass(side: "home" | "away"): string {
    if (!match.value) return "text-gray-800";

    const r = match.value.result;

    if (r === MatchResult.Pending || r === MatchResult.InProgress)
        return "text-gray-800";
    if (r === MatchResult.Draw) return "text-amber-600";

    const won =
        (side === "home" && r === MatchResult.HomeWin) ||
        (side === "away" && r === MatchResult.AwayWin);
    return won ? "text-emerald-600" : "text-gray-400";
}
</script>

<template>
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Back link -->
        <BackLink fallback="/" />

        <!-- Loading skeleton -->
        <div
            v-if="isPending"
            class="animate-pulse space-y-4"
            aria-busy="true"
            aria-label="Chargement du match…"
        >
            <div class="h-6 w-32 bg-gray-200 rounded-full" />
            <div
                class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-12 space-y-8"
            >
                <div class="flex items-center justify-center gap-8">
                    <div class="space-y-3 flex-1">
                        <div class="h-6 bg-gray-200 rounded w-3/4 ml-auto" />
                        <div class="h-4 bg-gray-100 rounded w-1/2 ml-auto" />
                    </div>
                    <div class="h-16 w-28 bg-gray-200 rounded-xl" />
                    <div class="space-y-3 flex-1">
                        <div class="h-6 bg-gray-200 rounded w-3/4" />
                        <div class="h-4 bg-gray-100 rounded w-1/2" />
                    </div>
                </div>
                <div
                    class="border-t border-gray-100 pt-6 grid grid-cols-2 gap-6"
                >
                    <div class="space-y-2">
                        <div class="h-4 bg-gray-100 rounded w-32" />
                        <div class="h-4 bg-gray-100 rounded w-24" />
                        <div class="h-4 bg-gray-100 rounded w-28" />
                    </div>
                    <div class="space-y-2">
                        <div class="h-4 bg-gray-100 rounded w-32" />
                        <div class="h-4 bg-gray-100 rounded w-24" />
                        <div class="h-4 bg-gray-100 rounded w-28" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Error state -->
        <div
            v-else-if="error"
            role="alert"
            class="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
        >
            <p class="text-red-600 font-medium">
                Impossible de charger ce match.
            </p>
            <p class="text-sm text-red-400 mt-1">{{ error.message }}</p>
        </div>

        <!-- Match detail -->
        <template v-else-if="match">
            <!-- Tournament breadcrumb -->
            <div
                v-if="match.tournament"
                class="mb-4"
            >
                <RouterLink
                    :to="`/tournaments/${match.tournament.id}`"
                    class="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                >
                    <svg
                        class="size-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                    {{ match.tournament.name }}
                </RouterLink>
            </div>

            <!-- Status badge + date -->
            <div class="flex items-center gap-3 mb-5">
                <span
                    v-if="resultLabel"
                    :class="[
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
                        resultLabel.color,
                    ]"
                >
                    <span
                        v-if="resultLabel.live"
                        class="size-1.5 rounded-full bg-blue-500 animate-pulse"
                        aria-hidden="true"
                    />
                    {{ resultLabel.text }}
                </span>
                <span class="text-sm text-gray-400">
                    {{ formatDate(match.date) }} · {{ formatTime(match.date) }}
                </span>
            </div>

            <!-- Score card -->
            <div
                class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4"
            >
                <!-- Scoreboard -->
                <div
                    class="px-6 sm:px-12 py-8 sm:py-12 flex items-center gap-4 sm:gap-8"
                >
                    <!-- Home team -->
                    <div class="flex-1 text-right">
                        <p
                            :class="[
                                'text-lg sm:text-2xl lg:text-3xl font-bold leading-tight',
                                teamClass('home'),
                            ]"
                            :title="match.homeTeam.name"
                        >
                            {{ match.homeTeam.name }}
                        </p>
                        <p
                            class="text-xs text-gray-400 mt-1.5 uppercase tracking-widest"
                        >
                            Domicile
                        </p>
                    </div>

                    <!-- Score or VS -->
                    <div
                        class="shrink-0 text-center min-w-20 sm:min-w-32"
                        :aria-label="
                            match.result !== MatchResult.Pending
                                ? `Score : ${match.homeScore} à ${match.awayScore}`
                                : 'Match à venir'
                        "
                    >
                        <template v-if="match.result !== MatchResult.Pending">
                            <div
                                class="flex items-center justify-center gap-2 sm:gap-3"
                                aria-hidden="true"
                            >
                                <span
                                    class="text-4xl sm:text-6xl font-black tabular-nums text-gray-800"
                                    >{{ match.homeScore }}</span
                                >
                                <span
                                    class="text-2xl sm:text-4xl font-light text-gray-300"
                                    >–</span
                                >
                                <span
                                    class="text-4xl sm:text-6xl font-black tabular-nums text-gray-800"
                                    >{{ match.awayScore }}</span
                                >
                            </div>
                        </template>
                        <template v-else>
                            <span
                                class="text-2xl sm:text-4xl font-bold text-gray-200 tracking-widest"
                                aria-hidden="true"
                                >VS</span
                            >
                        </template>
                    </div>

                    <!-- Away team -->
                    <div class="flex-1 text-left">
                        <p
                            :class="[
                                'text-lg sm:text-2xl lg:text-3xl font-bold leading-tight',
                                teamClass('away'),
                            ]"
                            :title="match.awayTeam.name"
                        >
                            {{ match.awayTeam.name }}
                        </p>
                        <p
                            class="text-xs text-gray-400 mt-1.5 uppercase tracking-widest"
                        >
                            Extérieur
                        </p>
                    </div>
                </div>

                <!-- Players -->
                <div
                    v-if="
                        match.homeTeam.users?.length ||
                        match.awayTeam.users?.length
                    "
                    class="border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100"
                >
                    <!-- Home players -->
                    <div class="px-6 sm:px-10 py-5 sm:py-7">
                        <h3
                            class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4"
                        >
                            {{ match.homeTeam.name }}
                        </h3>
                        <ul class="space-y-2.5">
                            <li
                                v-for="(user, i) in match.homeTeam.users"
                                :key="i"
                                class="flex items-center gap-3 text-sm text-gray-700"
                            >
                                <span
                                    class="size-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0"
                                    aria-hidden="true"
                                >
                                    {{ user.name[0] }}{{ user.surname[0] }}
                                </span>
                                {{ user.name }} {{ user.surname }}
                            </li>
                        </ul>
                    </div>

                    <!-- Away players -->
                    <div class="px-6 sm:px-10 py-5 sm:py-7">
                        <h3
                            class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4"
                        >
                            {{ match.awayTeam.name }}
                        </h3>
                        <ul class="space-y-2.5">
                            <li
                                v-for="(user, i) in match.awayTeam.users"
                                :key="i"
                                class="flex items-center gap-3 text-sm text-gray-700"
                            >
                                <span
                                    class="size-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0"
                                    aria-hidden="true"
                                >
                                    {{ user.name[0] }}{{ user.surname[0] }}
                                </span>
                                {{ user.name }} {{ user.surname }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
