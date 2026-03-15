<script setup lang="ts">
import { ref, watch, computed } from "vue";
import ListSection from "@/components/common/ListSection.vue";
import { useQuery } from "@/composables/useQuery";
import { tournamentsApi } from "@/api";
import type { Tournament } from "@/types/api";
import { formatDateShort } from "@/utils/date";

const props = defineProps<{
    /** Optional section title — hidden if not provided */
    title?: string;
    /** Cap the number of displayed tournaments */
    maxDisplay?: number;
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

const { data: tournaments, isPending } = useQuery(
    signal =>
        tournamentsApi.getAll({
            date: selectedDate.value || undefined,
            signal,
        }),
    { watch: [selectedDate] }
);

/** Liste des tournois affichés (tronquée selon maxDisplay) avec statut calculé. */
const visibleTournaments = computed(() => {
    const list = props.maxDisplay
        ? tournaments.value?.slice(0, props.maxDisplay)
        : tournaments.value;
    return list?.map(t => ({ ...t, status: getStatus(t) })) ?? [];
});

const isEmpty = computed(() => !isPending.value && !tournaments.value?.length);

type TournamentStatus = "ongoing" | "upcoming" | "ended";

/**
 * Détermine le statut du tournoi selon les dates (en cours, à venir, terminé).
 * @param {Tournament} tournament
 * @returns {TournamentStatus}
 */
function getStatus(tournament: Tournament): TournamentStatus {
    const now = new Date();
    const start = new Date(tournament.startDate);
    const end = new Date(tournament.endDate);

    if (now < start) return "upcoming";
    if (now > end) return "ended";
    return "ongoing";
}

const STATUS_LABEL: Record<TournamentStatus, string> = {
    ongoing: "En cours",
    upcoming: "À venir",
    ended: "Terminé",
};

const STATUS_BADGE: Record<TournamentStatus, string> = {
    ongoing: "bg-emerald-50 text-emerald-700",
    upcoming: "bg-blue-50 text-blue-700",
    ended: "bg-gray-100 text-gray-500",
};
</script>

<template>
    <ListSection
        v-model:date="selectedDate"
        :title="title ?? 'Tournois'"
        :show-title="!!title"
        heading-id="tournaments-heading"
        :is-pending="isPending"
        :is-empty="isEmpty"
        empty-message="Aucun tournoi pour cette période."
    >
        <div
            class="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
        >
            <ul role="list" class="divide-y divide-gray-100">
                <li
                    v-for="tournament in visibleTournaments"
                    :key="tournament.id"
                >
                    <RouterLink
                        :to="`/tournaments/${tournament.id}`"
                        :aria-label="`Tournoi ${tournament.name}, ${STATUS_LABEL[tournament.status]}`"
                        class="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
                    >
                        <!-- Emerald accent -->
                        <span
                            class="w-1 h-8 rounded-full bg-emerald-600 shrink-0"
                            aria-hidden="true"
                        />

                        <!-- Name + dates -->
                        <div class="flex-1 min-w-0">
                            <p
                                class="text-sm font-semibold text-gray-900 truncate"
                            >
                                {{ tournament.name }}
                            </p>
                            <p class="text-xs text-gray-400 mt-0.5">
                                {{ formatDateShort(tournament.startDate) }}
                                <span aria-hidden="true"> → </span>
                                <span class="sr-only">au </span>
                                {{ formatDateShort(tournament.endDate) }}
                            </p>
                        </div>

                        <!-- Team count -->
                        <span
                            v-if="tournament.teams"
                            class="text-xs text-gray-400 shrink-0 hidden sm:block"
                            aria-hidden="true"
                        >
                            {{ tournament.teams.length }}
                            {{
                                tournament.teams.length === 1
                                    ? "équipe"
                                    : "équipes"
                            }}
                        </span>

                        <!-- Status badge -->
                        <span
                            :class="[
                                'shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full',
                                STATUS_BADGE[tournament.status],
                            ]"
                            aria-hidden="true"
                        >
                            {{ STATUS_LABEL[tournament.status] }}
                        </span>
                    </RouterLink>
                </li>
            </ul>
        </div>
    </ListSection>
</template>
