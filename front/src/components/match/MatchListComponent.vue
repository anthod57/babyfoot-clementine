<script setup lang="ts">
import { ref, watch, computed } from "vue";
import ListSection from "@/components/common/ListSection.vue";
import { useQuery } from "@/composables/useQuery";
import { matchesApi, tournamentsApi } from "@/api";
import { MatchResult } from "@/types/api";
import type { MatchWithTeams } from "@/types/api";
import { formatTime, toISOString } from "@/utils/date";

const props = defineProps<{
    /** If provided, only fetch matches for this tournament */
    tournamentId?: number;
    /** Optional section title — hidden if not provided */
    title?: string;
    /** Cap the number of displayed matches */
    maxDisplay?: number;
    /** Filter by result: 0=Pending, 1=HomeWin, 2=AwayWin, 3=Draw, 4=InProgress */
    result?: number;
    /** If true, only fetch pending matches scheduled in the future */
    upcoming?: boolean;
}>();

/**
 * Retourne la date du jour au format ISO (YYYY-MM-DD).
 * @returns {string}
 */
function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

const selectedDate = ref(todayISO());

watch(selectedDate, val => {
    if (!val) selectedDate.value = todayISO();
});

const { data: matches, isPending } = useQuery(
    signal => {
        const date = selectedDate.value || undefined;
        return props.tournamentId
            ? tournamentsApi.getMatches(props.tournamentId, { date, signal })
            : matchesApi.getAll({
                  date,
                  result: props.result,
                  upcoming: props.upcoming,
                  signal,
              });
    },
    { watch: [selectedDate] }
);

/** Liste des matchs affichés (tronquée selon maxDisplay). */
const visibleMatches = computed(() =>
    props.maxDisplay ? matches.value?.slice(0, props.maxDisplay) : matches.value
);

const isEmpty = computed(() => !isPending.value && !matches.value?.length);

/**
 * Classes CSS pour l'équipe domicile ou extérieure selon le résultat du match.
 * @param {MatchWithTeams} match
 * @param {"home" | "away"} side
 * @returns {string}
 */
function teamClass(match: MatchWithTeams, side: "home" | "away"): string {
    if (
        match.result === MatchResult.Pending ||
        match.result === MatchResult.InProgress
    )
        return "text-gray-700";

    if (match.result === MatchResult.Draw) return "text-amber-600";
    const won =
        (side === "home" && match.result === MatchResult.HomeWin) ||
        (side === "away" && match.result === MatchResult.AwayWin);
    return won ? "text-emerald-600" : "text-gray-400";
}
</script>

<template>
    <ListSection
        v-model:date="selectedDate"
        :title="title ?? 'Matchs'"
        :show-title="!!title"
        heading-id="matches-heading"
        :is-pending="isPending"
        :is-empty="isEmpty"
        empty-message="Aucun match pour cette date."
    >
        <div
            class="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
        >
            <ul role="list" class="divide-y divide-gray-100">
                <li v-for="match in visibleMatches" :key="match.id">
                    <RouterLink
                        :to="`/matches/${match.id}`"
                        :aria-label="`Match : ${match.homeTeam.name} contre ${match.awayTeam.name}`"
                        class="grid items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
                        style="grid-template-columns: 3.5rem 1fr auto 1fr"
                    >
                        <!-- Time -->
                        <time
                            :datetime="toISOString(match.date)"
                            class="text-sm font-mono text-gray-400 tabular-nums"
                        >
                            {{ formatTime(match.date) }}
                        </time>

                        <!-- Home team -->
                        <span
                            :class="[
                                'text-sm font-semibold text-right truncate',
                                teamClass(match, 'home'),
                            ]"
                            :title="match.homeTeam.name"
                        >
                            {{ match.homeTeam.name }}
                        </span>

                        <!-- Score, Live indicator, or VS -->
                        <span
                            class="text-sm font-bold tabular-nums text-center whitespace-nowrap px-1"
                            :aria-label="
                                match.result === MatchResult.InProgress
                                    ? 'En cours'
                                    : match.result !== MatchResult.Pending
                                      ? `${match.homeScore} à ${match.awayScore}`
                                      : 'contre'
                            "
                        >
                            <template
                                v-if="match.result === MatchResult.InProgress"
                            >
                                <span
                                    class="inline-flex items-center gap-1 text-blue-500"
                                    aria-hidden="true"
                                >
                                    <span
                                        class="size-1.5 rounded-full bg-blue-500 animate-pulse"
                                    />
                                    Live
                                </span>
                            </template>
                            <template
                                v-else-if="match.result !== MatchResult.Pending"
                            >
                                <span class="text-gray-400" aria-hidden="true"
                                    >{{ match.homeScore }} –
                                    {{ match.awayScore }}</span
                                >
                            </template>
                            <template v-else>
                                <span class="text-gray-400" aria-hidden="true"
                                    >vs</span
                                >
                            </template>
                        </span>

                        <!-- Away team -->
                        <span
                            :class="[
                                'text-sm font-semibold truncate',
                                teamClass(match, 'away'),
                            ]"
                            :title="match.awayTeam.name"
                        >
                            {{ match.awayTeam.name }}
                        </span>
                    </RouterLink>
                </li>
            </ul>
        </div>
    </ListSection>
</template>
