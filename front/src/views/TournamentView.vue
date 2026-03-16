<script setup lang="ts">
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";
import BackLink from "@/components/common/BackLink.vue";
import { useQuery } from "@/composables/useQuery";
import { tournamentsApi } from "@/api";
import { MatchResult } from "@/types/api";
import type { Team } from "@/types/api";
import { formatDateShort } from "@/utils/date";
import MatchListComponent from "@/components/match/MatchListComponent.vue";

const route = useRoute();
const id = Number(route.params.id);

const {
    data: tournament,
    isPending: isTournamentPending,
    error,
} = useQuery(signal => tournamentsApi.getById(id, { signal }));

const { data: teams, isPending: isTeamsPending } = useQuery(signal =>
    tournamentsApi.getTeams(id, { signal })
);

/** Tous les matchs du tournoi (sans filtre date), pour classement et matrice. */
const { data: allMatches, isPending: isMatchesPending } = useQuery(signal =>
    tournamentsApi.getMatches(id, { signal })
);

const isPending = computed(
    () =>
        isTournamentPending.value ||
        isTeamsPending.value ||
        isMatchesPending.value
);

type TournamentStatus = "upcoming" | "ongoing" | "ended";

/** Statut du tournoi selon les dates (à venir, en cours, terminé). */
const status = computed((): TournamentStatus | null => {
    if (!tournament.value) return null;

    const now = new Date();
    const start = new Date(tournament.value.startDate);
    const end = new Date(tournament.value.endDate);

    if (now < start) return "upcoming";
    if (now > end) return "ended";

    return "ongoing";
});

const STATUS_CONFIG: Record<
    TournamentStatus,
    { text: string; color: string; dot: string }
> = {
    upcoming: {
        text: "À venir",
        color: "bg-blue-100 text-blue-700",
        dot: "bg-blue-400",
    },
    ongoing: {
        text: "En cours",
        color: "bg-emerald-100 text-emerald-700",
        dot: "bg-emerald-500",
    },
    ended: {
        text: "Terminé",
        color: "bg-gray-100 text-gray-500",
        dot: "bg-gray-400",
    },
};

/** Statistiques globales : total, joués, en cours, à venir. */
const stats = computed(() => {
    if (!allMatches.value) return null;

    const played = allMatches.value.filter(
        m =>
            m.result !== MatchResult.Pending &&
            m.result !== MatchResult.InProgress
    ).length;
    const inProgress = allMatches.value.filter(
        m => m.result === MatchResult.InProgress
    ).length;
    const upcoming = allMatches.value.filter(
        m => m.result === MatchResult.Pending
    ).length;
    return { total: allMatches.value.length, played, inProgress, upcoming };
});

interface StandingRow {
    team: Team;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number;
    ga: number;
    pts: number;
}

const standings = computed((): StandingRow[] => {
    if (!teams.value || !allMatches.value) return [];

    const map = new Map<number, StandingRow>();

    for (const team of teams.value) {
        map.set(team.id, {
            team,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            gf: 0,
            ga: 0,
            pts: 0,
        });
    }

    for (const match of allMatches.value) {
        const r = match.result;

        if (r === MatchResult.Pending || r === MatchResult.InProgress) continue;

        const home = map.get(match.homeTeamId);
        const away = map.get(match.awayTeamId);
        if (!home || !away) continue;

        home.played++;
        away.played++;
        home.gf += match.homeScore;
        home.ga += match.awayScore;
        away.gf += match.awayScore;
        away.ga += match.homeScore;

        if (r === MatchResult.HomeWin) {
            home.won++;
            home.pts += 3;
            away.lost++;
        } else if (r === MatchResult.AwayWin) {
            away.won++;
            away.pts += 3;
            home.lost++;
        } else if (r === MatchResult.Draw) {
            home.drawn++;
            home.pts += 1;
            away.drawn++;
            away.pts += 1;
        }
    }

    return [...map.values()].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        const gdDiff = b.gf - b.ga - (a.gf - a.ga);
        if (gdDiff !== 0) return gdDiff;
        return b.gf - a.gf;
    });
});

/** Indique si au moins un match a été joué (pour afficher classement et matrice). */
const hasPlayedMatches = computed(() =>
    standings.value.some(r => r.played > 0)
);

/** Liste des équipes ordonnée par classement. */
const rankedTeams = computed(() => standings.value.map(r => r.team));

/** Matrice de confrontations : map(homeId).get(awayId) → { homeScore, awayScore, result }. */
const matrix = computed(() => {
    if (!allMatches.value) return null;

    const m = new Map<
        number,
        Map<
            number,
            { homeScore: number; awayScore: number; result: MatchResult }
        >
    >();
    for (const match of allMatches.value) {
        if (!m.has(match.homeTeamId)) m.set(match.homeTeamId, new Map());

        m.get(match.homeTeamId)!.set(match.awayTeamId, {
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            result: match.result,
        });
    }
    return m;
});

/**
 * Données d'une cellule de la matrice (score et perspective).
 * @param {number} rowTeamId
 * @param {number} colTeamId
 * @returns {{ score: string; result: MatchResult; perspective: "home" | "away" } | null}
 */
function cellData(rowTeamId: number, colTeamId: number) {
    const asHome = matrix.value?.get(rowTeamId)?.get(colTeamId);

    if (asHome)
        return {
            score: `${asHome.homeScore}–${asHome.awayScore}`,
            result: asHome.result,
            perspective: "home" as const,
        };

    const asAway = matrix.value?.get(colTeamId)?.get(rowTeamId);

    if (asAway)
        return {
            score: `${asAway.awayScore}–${asAway.homeScore}`,
            result: asAway.result,
            perspective: "away" as const,
        };
    return null;
}

/**
 * Classes CSS pour une cellule selon le résultat et la perspective (domicile/extérieur).
 * @param {MatchResult} result
 * @param {"home" | "away"} perspective
 * @returns {string}
 */
function cellClass(result: MatchResult, perspective: "home" | "away"): string {
    if (result === MatchResult.Pending) return "text-gray-400";
    if (result === MatchResult.InProgress) return "text-blue-600 font-semibold";
    if (result === MatchResult.Draw)
        return "text-amber-700 bg-amber-50 font-semibold";
    const win =
        (perspective === "home" && result === MatchResult.HomeWin) ||
        (perspective === "away" && result === MatchResult.AwayWin);
    return win
        ? "text-emerald-700 bg-emerald-50 font-semibold"
        : "text-red-700 bg-red-50 font-semibold";
}
</script>

<template>
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-w-0">
        <!-- Back link -->
        <BackLink fallback="/tournaments" />

        <!-- Loading skeleton -->
        <div
            v-if="isPending"
            class="animate-pulse space-y-4"
            aria-busy="true"
            aria-label="Chargement du tournoi…"
        >
            <div class="h-8 w-64 bg-gray-200 rounded-lg" />
            <div class="h-4 w-40 bg-gray-100 rounded" />
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                <div class="lg:col-span-2 space-y-3">
                    <div class="h-48 bg-gray-100 rounded-2xl" />
                    <div class="h-64 bg-gray-100 rounded-2xl" />
                </div>
                <div class="h-48 bg-gray-100 rounded-2xl" />
            </div>
        </div>

        <!-- Error state -->
        <div
            v-else-if="error"
            role="alert"
            class="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
        >
            <p class="text-red-600 font-medium">
                Impossible de charger ce tournoi.
            </p>
            <p class="text-sm text-red-400 mt-1">{{ error.message }}</p>
        </div>

        <!-- ── Main content ─────────────────────────────────────────────── -->
        <template v-else-if="tournament">
            <!-- Header card -->
            <div
                class="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 sm:px-10 py-7 mb-6"
            >
                <div class="flex flex-wrap items-start justify-between gap-4">
                    <div class="min-w-0">
                        <h1
                            class="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight"
                        >
                            {{ tournament.name }}
                        </h1>
                        <p
                            class="mt-1.5 text-sm text-gray-500 flex items-center gap-1.5"
                        >
                            <time :datetime="tournament.startDate">{{
                                formatDateShort(tournament.startDate)
                            }}</time>
                            <span aria-hidden="true">→</span>
                            <span class="sr-only">au </span>
                            <time :datetime="tournament.endDate">{{
                                formatDateShort(tournament.endDate)
                            }}</time>
                        </p>
                        <p
                            v-if="tournament.description"
                            class="mt-3 text-sm text-gray-600 max-w-prose"
                        >
                            {{ tournament.description }}
                        </p>
                    </div>
                    <span
                        v-if="status"
                        :class="[
                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0',
                            STATUS_CONFIG[status].color,
                        ]"
                    >
                        <span
                            :class="[
                                'size-1.5 rounded-full',
                                STATUS_CONFIG[status].dot,
                                status === 'ongoing' ? 'animate-pulse' : '',
                            ]"
                            aria-hidden="true"
                        />
                        {{ STATUS_CONFIG[status].text }}
                    </span>
                </div>

                <!-- Stats bar -->
                <div
                    v-if="stats"
                    class="mt-5 pt-5 border-t border-gray-100 flex flex-wrap gap-6 text-sm text-gray-500"
                >
                    <span
                        ><strong class="text-gray-800 font-semibold">{{
                            teams?.length ?? 0
                        }}</strong>
                        équipe{{ (teams?.length ?? 0) !== 1 ? "s" : "" }}</span
                    >
                    <span
                        ><strong class="text-gray-800 font-semibold">{{
                            stats.total
                        }}</strong>
                        match{{ stats.total !== 1 ? "s" : "" }}</span
                    >
                    <span v-if="stats.played"
                        ><strong class="text-emerald-600 font-semibold">{{
                            stats.played
                        }}</strong>
                        joué{{ stats.played !== 1 ? "s" : "" }}</span
                    >
                    <span v-if="stats.inProgress"
                        ><strong class="text-blue-600 font-semibold">{{
                            stats.inProgress
                        }}</strong>
                        en cours</span
                    >
                    <span v-if="stats.upcoming"
                        ><strong class="text-gray-800 font-semibold">{{
                            stats.upcoming
                        }}</strong>
                        à venir</span
                    >
                </div>
            </div>

            <!-- Teams grid (no matches played yet) -->
            <section
                v-if="!hasPlayedMatches && teams?.length"
                aria-labelledby="teams-heading-flat"
                class="mb-4"
            >
                <div
                    class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                    <div
                        class="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
                    >
                        <h2
                            id="teams-heading-flat"
                            class="text-sm font-bold text-gray-900 uppercase tracking-widest"
                        >
                            Équipes participantes
                        </h2>
                        <span class="text-xs text-gray-400"
                            >{{ teams.length }} équipe{{
                                teams.length !== 1 ? "s" : ""
                            }}</span
                        >
                    </div>
                    <ul
                        role="list"
                        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 divide-x divide-y divide-gray-50"
                    >
                        <li
                            v-for="(team, i) in teams"
                            :key="team.id"
                            class="flex items-center gap-3 px-5 py-3.5"
                        >
                            <span
                                class="size-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0"
                                aria-hidden="true"
                            >
                                {{ i + 1 }}
                            </span>
                            <span
                                class="text-sm text-gray-700 truncate"
                                :title="team.name"
                                >{{ team.name }}</span
                            >
                        </li>
                    </ul>
                </div>
            </section>

            <!-- Two-column layout (matches played) -->
            <div
                v-if="hasPlayedMatches"
                class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4"
            >
                <!-- Main column: classement -->
                <div class="lg:col-span-2 space-y-4">
                    <!-- Classement -->
                    <section aria-labelledby="standings-heading">
                        <div
                            class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                            <div class="px-6 py-4 border-b border-gray-100">
                                <h2
                                    id="standings-heading"
                                    class="text-sm font-bold text-gray-900 uppercase tracking-widest"
                                >
                                    Classement
                                </h2>
                            </div>

                            <div class="overflow-x-auto">
                                <table
                                    class="w-full text-sm"
                                    aria-label="Classement du tournoi"
                                >
                                    <thead>
                                        <tr
                                            class="text-xs text-gray-400 uppercase tracking-widest border-b border-gray-100"
                                        >
                                            <th
                                                scope="col"
                                                class="text-left px-6 py-2.5 font-medium w-8"
                                            >
                                                #
                                            </th>
                                            <th
                                                scope="col"
                                                class="text-left px-2 py-2.5 font-medium"
                                            >
                                                Équipe
                                            </th>
                                            <th
                                                scope="col"
                                                class="text-center px-3 py-2.5 font-medium"
                                                title="Matchs joués"
                                            >
                                                J
                                            </th>
                                            <th
                                                scope="col"
                                                class="text-center px-3 py-2.5 font-medium"
                                                title="Victoires"
                                            >
                                                V
                                            </th>
                                            <th
                                                scope="col"
                                                class="text-center px-3 py-2.5 font-medium"
                                                title="Nuls"
                                            >
                                                N
                                            </th>
                                            <th
                                                scope="col"
                                                class="text-center px-3 py-2.5 font-medium"
                                                title="Défaites"
                                            >
                                                D
                                            </th>
                                            <th
                                                scope="col"
                                                class="text-center px-3 py-2.5 font-medium"
                                                title="Buts pour"
                                            >
                                                BP
                                            </th>
                                            <th
                                                scope="col"
                                                class="text-center px-3 py-2.5 font-medium"
                                                title="Buts contre"
                                            >
                                                BC
                                            </th>
                                            <th
                                                scope="col"
                                                class="text-center px-3 py-2.5 font-medium"
                                                title="Différence de buts"
                                            >
                                                DB
                                            </th>
                                            <th
                                                scope="col"
                                                class="text-center px-4 py-2.5 font-medium"
                                                title="Points"
                                            >
                                                Pts
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-50">
                                        <tr
                                            v-for="(row, i) in standings"
                                            :key="row.team.id"
                                            :class="[
                                                'transition-colors',
                                                i === 0 && row.played > 0
                                                    ? 'bg-emerald-50/50'
                                                    : 'hover:bg-gray-50',
                                            ]"
                                        >
                                            <td
                                                class="px-6 py-3 text-gray-400 font-mono tabular-nums text-xs"
                                            >
                                                {{ i + 1 }}
                                            </td>
                                            <td
                                                class="px-2 py-3 font-semibold text-gray-800 truncate max-w-56"
                                            >
                                                {{ row.team.name }}
                                            </td>
                                            <td
                                                class="px-3 py-3 text-center tabular-nums text-gray-600"
                                            >
                                                {{ row.played }}
                                            </td>
                                            <td
                                                class="px-3 py-3 text-center tabular-nums text-emerald-600 font-medium"
                                            >
                                                {{ row.won }}
                                            </td>
                                            <td
                                                class="px-3 py-3 text-center tabular-nums text-amber-600"
                                            >
                                                {{ row.drawn }}
                                            </td>
                                            <td
                                                class="px-3 py-3 text-center tabular-nums text-gray-400"
                                            >
                                                {{ row.lost }}
                                            </td>
                                            <td
                                                class="px-3 py-3 text-center tabular-nums text-gray-600"
                                            >
                                                {{ row.gf }}
                                            </td>
                                            <td
                                                class="px-3 py-3 text-center tabular-nums text-gray-600"
                                            >
                                                {{ row.ga }}
                                            </td>
                                            <td
                                                class="px-3 py-3 text-center tabular-nums"
                                                :class="
                                                    row.gf - row.ga > 0
                                                        ? 'text-emerald-600'
                                                        : row.gf - row.ga < 0
                                                          ? 'text-red-500'
                                                          : 'text-gray-400'
                                                "
                                            >
                                                {{
                                                    row.gf - row.ga > 0
                                                        ? "+"
                                                        : ""
                                                }}{{ row.gf - row.ga }}
                                            </td>
                                            <td
                                                class="px-4 py-3 text-center font-black tabular-nums text-gray-900"
                                            >
                                                {{ row.pts }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Sidebar: équipes -->
                <aside aria-labelledby="teams-heading">
                    <div
                        class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                        <div class="px-6 py-4 border-b border-gray-100">
                            <h2
                                id="teams-heading"
                                class="text-sm font-bold text-gray-900 uppercase tracking-widest"
                            >
                                Équipes
                                <span
                                    v-if="teams?.length"
                                    class="ml-1.5 text-xs font-normal text-gray-400"
                                    >({{ teams.length }})</span
                                >
                            </h2>
                        </div>
                        <div
                            v-if="!teams?.length"
                            class="px-6 py-6 text-sm text-gray-400 text-center"
                        >
                            Aucune équipe inscrite.
                        </div>
                        <ul v-else role="list" class="divide-y divide-gray-50">
                            <li
                                v-for="(team, i) in rankedTeams.length
                                    ? rankedTeams
                                    : teams"
                                :key="team.id"
                                class="flex items-center gap-3 px-6 py-3"
                            >
                                <span
                                    class="size-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0"
                                    aria-hidden="true"
                                >
                                    {{ i + 1 }}
                                </span>
                                <span
                                    class="text-sm text-gray-700 truncate"
                                    :title="team.name"
                                >
                                    {{ team.name }}
                                </span>
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>

            <!-- Tableau des confrontations — pleine largeur -->
            <section
                v-if="rankedTeams.length > 1 && hasPlayedMatches"
                aria-labelledby="matrix-heading"
                class="mb-4 min-w-0"
            >
                <div
                    class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-w-0"
                >
                    <div class="px-6 py-4 border-b border-gray-100">
                        <h2
                            id="matrix-heading"
                            class="text-sm font-bold text-gray-900 uppercase tracking-widest"
                        >
                            Tableau des confrontations
                        </h2>
                    </div>
                    <div
                        class="overflow-x-auto w-full min-w-0"
                        style="contain: inline-size"
                    >
                        <table
                            class="text-xs"
                            aria-label="Résultats des confrontations directes"
                        >
                            <thead>
                                <tr>
                                    <th
                                        scope="col"
                                        class="min-w-32 px-4 py-3 text-left text-gray-400 font-medium border-b border-r border-gray-100"
                                    >
                                        ↓ Dom. / Ext. →
                                    </th>
                                    <th
                                        v-for="team in rankedTeams"
                                        :key="team.id"
                                        scope="col"
                                        class="px-3 py-3 text-center font-medium text-gray-600 min-w-20 border-b border-gray-100 whitespace-nowrap"
                                    >
                                        {{ team.name }}
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50">
                                <tr
                                    v-for="rowTeam in rankedTeams"
                                    :key="rowTeam.id"
                                >
                                    <th
                                        scope="row"
                                        class="sticky left-0 z-10 bg-white px-4 py-2.5 font-semibold text-gray-700 border-r border-gray-100 whitespace-nowrap"
                                    >
                                        {{ rowTeam.name }}
                                    </th>
                                    <td
                                        v-for="colTeam in rankedTeams"
                                        :key="colTeam.id"
                                        class="px-3 py-2.5 text-center tabular-nums rounded"
                                        :class="
                                            rowTeam.id === colTeam.id
                                                ? 'bg-gray-100 text-gray-300'
                                                : cellData(
                                                        rowTeam.id,
                                                        colTeam.id
                                                    )
                                                  ? cellClass(
                                                        cellData(
                                                            rowTeam.id,
                                                            colTeam.id
                                                        )!.result,
                                                        cellData(
                                                            rowTeam.id,
                                                            colTeam.id
                                                        )!.perspective
                                                    )
                                                  : 'text-gray-300'
                                        "
                                    >
                                        <template
                                            v-if="rowTeam.id === colTeam.id"
                                            >–</template
                                        >
                                        <template
                                            v-else-if="
                                                cellData(rowTeam.id, colTeam.id)
                                            "
                                        >
                                            {{
                                                cellData(
                                                    rowTeam.id,
                                                    colTeam.id
                                                )!.result ===
                                                MatchResult.Pending
                                                    ? "·"
                                                    : cellData(
                                                          rowTeam.id,
                                                          colTeam.id
                                                      )!.score
                                            }}
                                        </template>
                                        <template v-else>·</template>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p
                        class="px-6 py-3 text-xs text-gray-400 border-t border-gray-100"
                    >
                        Lecture : ligne = équipe domicile · colonne = équipe
                        extérieure.
                        <span class="inline-flex gap-3 ml-2 flex-wrap">
                            <span class="text-emerald-700">■ Victoire</span>
                            <span class="text-red-600">■ Défaite</span>
                            <span class="text-amber-700">■ Nul</span>
                            <span class="text-gray-400">· À venir</span>
                        </span>
                    </p>
                </div>
            </section>

            <!-- Matchs section -->
            <MatchListComponent
                :tournament-id="id"
                title="Matchs du tournoi"
                :max-display="100"
                class="mt-2"
            />
        </template>
    </div>
</template>
