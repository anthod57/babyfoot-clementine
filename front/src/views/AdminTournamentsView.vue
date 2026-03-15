<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { RouterLink } from "vue-router";
import BackLink from "@/components/common/BackLink.vue";
import { useQuery } from "@/composables/useQuery";
import { useDebouncedRef } from "@/composables/useDebouncedRef";
import { tournamentsApi, teamsApi, matchesApi } from "@/api";
import type { Tournament, Team, MatchWithTeams } from "@/types/api";
import { MatchResult } from "@/types/api";
import ButtonComponent from "@/components/common/ButtonComponent.vue";
import { formatDateShort } from "@/utils/date";
import { getErrorMessage } from "@/utils/error";

const TOURNAMENTS_PER_PAGE = 10;

const currentPage = ref(1);
const searchInput = ref("");
const searchQuery = useDebouncedRef(searchInput, 300);

const {
    data: tournamentsResponse,
    isPending: tournamentsPending,
    refresh: refreshTournaments,
} = useQuery(
    signal =>
        tournamentsApi.getAllPaginated({
            page: currentPage.value,
            limit: TOURNAMENTS_PER_PAGE,
            search: searchQuery.value.trim() || undefined,
            signal,
        }),
    { watch: [currentPage, searchQuery] }
);

const tournaments = computed(() => tournamentsResponse.value?.data ?? []);
const totalTournaments = computed(() => tournamentsResponse.value?.total ?? 0);
const totalPages = computed(
    () => Math.ceil(totalTournaments.value / TOURNAMENTS_PER_PAGE) || 1
);
const hasPrev = computed(() => currentPage.value > 1);
const hasNext = computed(() => currentPage.value < totalPages.value);

const expandedTournamentId = ref<number | null>(null);

const expandedTeams = ref<Team[]>([]);
const expandedMatches = ref<MatchWithTeams[]>([]);
const isLoadingExpanded = ref(false);

async function loadExpandedData(tournamentId: number) {
    isLoadingExpanded.value = true;

    try {
        const [teams, matches] = await Promise.all([
            tournamentsApi.getTeams(tournamentId),
            tournamentsApi.getMatches(tournamentId),
        ]);
        expandedTeams.value = teams;
        expandedMatches.value = matches;
    } finally {
        isLoadingExpanded.value = false;
    }
}

/**
 * Expands or collapses the tournament row.
 * @param {Tournament} t
 * @returns {void}
 */
function toggleExpand(t: Tournament): void {
    if (expandedTournamentId.value === t.id) {
        expandedTournamentId.value = null;
    } else {
        expandedTournamentId.value = t.id;
        loadExpandedData(t.id);
    }
}

watch(expandedTournamentId, id => {
    if (id) loadExpandedData(id);
});

const { data: allTeams } = useQuery(signal =>
    teamsApi.getAllPaginated({ page: 1, limit: 500, signal }).then(r => r.data)
);

const availableTeamsForExpanded = computed(() => {
    if (!expandedTournamentId.value) return [];
    const participantIds = new Set(expandedTeams.value.map(t => t.id));
    return (allTeams.value ?? []).filter(t => !participantIds.has(t.id));
});

const showCreateModal = ref(false);
const createForm = ref({
    name: "",
    description: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
});
const createError = ref("");
const isCreating = ref(false);

/**
 * Opens the create modal with today's date.
 * @returns {void}
 */
function openCreateModal(): void {
    const today = new Date().toISOString().slice(0, 10);
    createForm.value = {
        name: "",
        description: "",
        startDate: today,
        endDate: today,
    };
    createError.value = "";
    showCreateModal.value = true;
}

function closeCreateModal() {
    showCreateModal.value = false;
}

/**
 * Creates a new tournament.
 * @returns {Promise<void>}
 */
async function submitCreate(): Promise<void> {
    createError.value = "";

    if (!createForm.value.name.trim()) {
        createError.value = "Le nom est requis.";
        return;
    }

    const start = new Date(createForm.value.startDate);
    const end = new Date(createForm.value.endDate);

    if (end < start) {
        createError.value = "La date de fin doit être après la date de début.";
        return;
    }

    isCreating.value = true;
    try {
        await tournamentsApi.create({
            name: createForm.value.name.trim(),
            description: createForm.value.description.trim() || undefined,
            startDate: createForm.value.startDate,
            endDate: createForm.value.endDate,
        });
        closeCreateModal();
        currentPage.value = 1;
        refreshTournaments();
    } catch (e) {
        createError.value = getErrorMessage(e, "Erreur lors de la création.");
    } finally {
        isCreating.value = false;
    }
}

const editingTournamentId = ref<number | null>(null);
const editForm = ref({ name: "", description: "", startDate: "", endDate: "" });
const isSavingTournament = ref(false);
const editTournamentError = ref("");

function startEditTournament(t: Tournament) {
    editingTournamentId.value = t.id;
    editForm.value = {
        name: t.name,
        description: t.description ?? "",
        startDate: t.startDate.slice(0, 10),
        endDate: t.endDate.slice(0, 10),
    };
    editTournamentError.value = "";
}

/**
 * Cancels tournament edit mode.
 * @returns {void}
 */
function cancelEditTournament(): void {
    editingTournamentId.value = null;
}

/**
 * Saves the tournament changes.
 * @returns {Promise<void>}
 */
async function submitEditTournament(): Promise<void> {
    if (!editingTournamentId.value) return;

    editTournamentError.value = "";

    if (!editForm.value.name.trim()) {
        editTournamentError.value = "Le nom est requis.";
        return;
    }

    const start = new Date(editForm.value.startDate);
    const end = new Date(editForm.value.endDate);

    if (end < start) {
        editTournamentError.value =
            "La date de fin doit être après la date de début.";
        return;
    }

    isSavingTournament.value = true;
    try {
        await tournamentsApi.update(editingTournamentId.value, {
            name: editForm.value.name.trim(),
            description: editForm.value.description.trim() || undefined,
            startDate: editForm.value.startDate,
            endDate: editForm.value.endDate,
        });
        cancelEditTournament();
        refreshTournaments();

        if (expandedTournamentId.value === editingTournamentId.value) {
            loadExpandedData(expandedTournamentId.value);
        }
    } catch (e) {
        editTournamentError.value = getErrorMessage(e, "Erreur.");
    } finally {
        isSavingTournament.value = false;
    }
}

const deletingTournamentId = ref<number | null>(null);
const isDeletingTournament = ref(false);

/**
 * Deletes the tournament after confirmation.
 * @param {Tournament} t
 * @returns {Promise<void>}
 */
async function confirmDeleteTournament(t: Tournament): Promise<void> {
    if (
        !confirm(
            `Supprimer le tournoi « ${t.name} » ? Tous les matchs seront supprimés.`
        )
    )
        return;
    isDeletingTournament.value = true;
    deletingTournamentId.value = t.id;
    try {
        await tournamentsApi.delete(t.id);
        if (expandedTournamentId.value === t.id)
            expandedTournamentId.value = null;
        if (tournaments.value.length === 1 && currentPage.value > 1)
            currentPage.value--;
        refreshTournaments();
    } catch (e) {
        alert(getErrorMessage(e, "Erreur lors de la suppression."));
    } finally {
        isDeletingTournament.value = false;
        deletingTournamentId.value = null;
    }
}

const addingTeamToId = ref<number | null>(null);

/**
 * Adds a team to the tournament.
 * @param {number} tournamentId
 * @param {number} teamId
 * @returns {Promise<void>}
 */
async function addTeamToTournament(
    tournamentId: number,
    teamId: number
): Promise<void> {
    addingTeamToId.value = tournamentId;

    try {
        await tournamentsApi.addTeam(tournamentId, teamId);
        await loadExpandedData(tournamentId);
    } catch (e) {
        alert(getErrorMessage(e, "Erreur lors de l'ajout."));
    } finally {
        addingTeamToId.value = null;
    }
}

async function removeTeamFromTournament(tournamentId: number, teamId: number) {
    if (!confirm("Retirer cette équipe du tournoi ?")) return;

    try {
        await tournamentsApi.removeTeam(tournamentId, teamId);
        await loadExpandedData(tournamentId);
    } catch (e) {
        alert(getErrorMessage(e, "Erreur."));
    }
}

const generatingMatchesForId = ref<number | null>(null);

/**
 * Generates round-robin matches for the tournament.
 * Blocks concurrent calls to avoid multiple overlapping requests (prevents stuck pending).
 * @param {number} tournamentId
 * @returns {Promise<void>}
 */
async function generateMatches(tournamentId: number): Promise<void> {
    if (generatingMatchesForId.value !== null) return;
    if (expandedTeams.value.length < 2) {
        alert("Il faut au moins 2 équipes pour générer les matchs.");
        return;
    }

    generatingMatchesForId.value = tournamentId;

    try {
        const created = await tournamentsApi.scheduleMatches(tournamentId);
        if (expandedTournamentId.value === tournamentId) {
            expandedMatches.value = created as MatchWithTeams[];
        }
    } catch (e) {
        alert(getErrorMessage(e, "Erreur lors de la génération."));
    } finally {
        generatingMatchesForId.value = null;
    }
}

const savingScoreMatchId = ref<number | null>(null);

const SCORE_SAVE_DEBOUNCE_MS = 400;
const pendingScoreUpdates = new Map<
    number,
    { homeScore: number; awayScore: number; result: number }
>();
const scoreDebounceTimers = new Map<number, ReturnType<typeof setTimeout>>();

function scheduleSaveMatchScore(
    m: MatchWithTeams,
    homeScore: number,
    awayScore: number,
    result: number
) {
    pendingScoreUpdates.set(m.id, { homeScore, awayScore, result });

    expandedMatches.value = expandedMatches.value.map(x =>
        x.id === m.id
            ? { ...x, homeScore, awayScore, result: result as MatchResult }
            : x
    );

    const existing = scoreDebounceTimers.get(m.id);
    if (existing) clearTimeout(existing);

    scoreDebounceTimers.set(
        m.id,
        setTimeout(async () => {
            scoreDebounceTimers.delete(m.id);
            const pending = pendingScoreUpdates.get(m.id);
            pendingScoreUpdates.delete(m.id);
            if (!pending) return;

            savingScoreMatchId.value = m.id;
            try {
                const updated = await matchesApi.update(m.id, pending);
                expandedMatches.value = expandedMatches.value.map(x =>
                    x.id === m.id ? { ...x, ...updated } : x
                );
            } catch (e) {
                alert(getErrorMessage(e, "Erreur."));
            } finally {
                savingScoreMatchId.value = null;
            }
        }, SCORE_SAVE_DEBOUNCE_MS)
    );
}

const editingMatchId = ref<number | null>(null);
const editMatchForm = ref({ homeTeamId: 0, awayTeamId: 0 });
const isSavingMatch = ref(false);
const editMatchError = ref("");

/**
 * Enters edit mode for the match (change teams).
 * @param {MatchWithTeams} m
 * @returns {void}
 */
function startEditMatch(m: MatchWithTeams): void {
    editingMatchId.value = m.id;
    editMatchForm.value = {
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
    };
    editMatchError.value = "";
}

/**
 * Cancels match edit mode.
 * @returns {void}
 */
function cancelEditMatch(): void {
    editingMatchId.value = null;
}

/**
 * Saves the match team changes.
 * @returns {Promise<void>}
 */
async function submitEditMatch(): Promise<void> {
    if (!editingMatchId.value) return;

    editMatchError.value = "";
    const { homeTeamId, awayTeamId } = editMatchForm.value;

    if (homeTeamId === awayTeamId) {
        editMatchError.value = "Les deux équipes doivent être différentes.";
        return;
    }

    isSavingMatch.value = true;

    try {
        const updated = await matchesApi.update(editingMatchId.value, {
            homeTeamId,
            awayTeamId,
        });
        expandedMatches.value = expandedMatches.value.map(x =>
            x.id === editingMatchId.value ? { ...x, ...updated } : x
        );
        cancelEditMatch();
    } catch (e) {
        editMatchError.value = getErrorMessage(e, "Erreur.");
    } finally {
        isSavingMatch.value = false;
    }
}

const RESULT_OPTIONS = [
    { value: MatchResult.Pending, label: "À jouer" },
    { value: MatchResult.HomeWin, label: "Victoire domicile" },
    { value: MatchResult.AwayWin, label: "Victoire extérieur" },
    { value: MatchResult.Draw, label: "Match nul" },
    { value: MatchResult.InProgress, label: "En cours" },
];

const editMatchHomeTeamOptions = computed(() =>
    expandedTeams.value.filter(t => t.id !== editMatchForm.value.awayTeamId)
);
const editMatchAwayTeamOptions = computed(() =>
    expandedTeams.value.filter(t => t.id !== editMatchForm.value.homeTeamId)
);
</script>

<template>
    <div
        class="w-full max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 py-8 lg:px-6 xl:px-8"
    >
        <BackLink fallback="/" />

        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 class="text-2xl font-bold text-gray-900">
                Gestion des tournois
            </h1>
            <div class="flex flex-wrap items-center gap-3">
                <input
                    v-model="searchInput"
                    type="search"
                    placeholder="Rechercher…"
                    aria-label="Rechercher un tournoi"
                    class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-48"
                    @input="currentPage = 1"
                />
                <ButtonComponent @click="openCreateModal"
                    >Créer un tournoi</ButtonComponent
                >
            </div>
        </div>

        <div v-if="tournamentsPending" class="space-y-4" aria-busy="true">
            <div
                v-for="i in 4"
                :key="i"
                class="h-20 bg-gray-100 rounded-xl animate-pulse"
            />
        </div>

        <div
            v-else-if="!tournaments.length"
            class="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200"
            role="status"
        >
            Aucun tournoi.
        </div>

        <div v-else class="space-y-3">
            <div
                v-for="t in tournaments"
                :key="t.id"
                class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
                <button
                    type="button"
                    :aria-label="`${expandedTournamentId === t.id ? 'Replier' : 'Déplier'} le tournoi ${t.name}`"
                    :aria-expanded="expandedTournamentId === t.id"
                    class="w-full px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-left hover:bg-gray-50 cursor-pointer"
                    @click="toggleExpand(t)"
                >
                    <div class="flex-1 min-w-0">
                        <h2 class="text-lg font-semibold text-gray-900">
                            {{ t.name }}
                        </h2>
                        <p class="text-xs text-gray-400 mt-0.5">
                            {{ formatDateShort(t.startDate) }} →
                            {{ formatDateShort(t.endDate) }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <RouterLink
                            v-if="editingTournamentId !== t.id"
                            :to="`/tournaments/${t.id}`"
                            :aria-label="`Voir le tournoi ${t.name}`"
                            class="text-sm text-gray-600 hover:text-gray-700 font-medium cursor-pointer"
                        >
                            Voir
                        </RouterLink>
                        <button
                            v-if="editingTournamentId !== t.id"
                            type="button"
                            :aria-label="`Modifier le tournoi ${t.name}`"
                            class="text-sm text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                            @click.stop="startEditTournament(t)"
                        >
                            Modifier
                        </button>
                        <button
                            type="button"
                            :aria-label="`Supprimer le tournoi ${t.name}`"
                            class="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            :disabled="
                                isDeletingTournament &&
                                deletingTournamentId === t.id
                            "
                            @click.stop="confirmDeleteTournament(t)"
                        >
                            {{
                                isDeletingTournament &&
                                deletingTournamentId === t.id
                                    ? "Suppression…"
                                    : "Supprimer"
                            }}
                        </button>
                        <svg
                            class="size-5 text-gray-400 transition-transform"
                            aria-hidden="true"
                            :class="
                                expandedTournamentId === t.id && 'rotate-180'
                            "
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </div>
                </button>

                <!-- Inline edit -->
                <div
                    v-if="editingTournamentId === t.id"
                    class="px-5 pb-4 border-t border-gray-100"
                >
                    <form
                        @submit.prevent="submitEditTournament"
                        class="space-y-3 pt-4"
                    >
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label
                                    class="block text-xs font-medium text-gray-500 mb-0.5"
                                    >Nom</label
                                >
                                <input
                                    v-model="editForm.name"
                                    type="text"
                                    class="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                                />
                            </div>
                            <div class="sm:col-span-2">
                                <label
                                    class="block text-xs font-medium text-gray-500 mb-0.5"
                                    >Description</label
                                >
                                <textarea
                                    v-model="editForm.description"
                                    rows="2"
                                    class="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label
                                    class="block text-xs font-medium text-gray-500 mb-0.5"
                                    >Date début</label
                                >
                                <input
                                    v-model="editForm.startDate"
                                    type="date"
                                    class="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label
                                    class="block text-xs font-medium text-gray-500 mb-0.5"
                                    >Date fin</label
                                >
                                <input
                                    v-model="editForm.endDate"
                                    type="date"
                                    class="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                                />
                            </div>
                        </div>
                        <p
                            v-if="editTournamentError"
                            role="alert"
                            class="text-sm text-red-600"
                        >
                            {{ editTournamentError }}
                        </p>
                        <div class="flex gap-2">
                            <ButtonComponent
                                size="sm"
                                :loading="isSavingTournament"
                                type="submit"
                                >Enregistrer</ButtonComponent
                            >
                            <ButtonComponent
                                size="sm"
                                variant="ghost"
                                :disabled="isSavingTournament"
                                type="button"
                                @click="cancelEditTournament"
                                >Annuler</ButtonComponent
                            >
                        </div>
                    </form>
                </div>

                <!-- Expanded content: v-if to avoid rendering 50+ match rows for each collapsed tournament -->
                <div
                    v-if="expandedTournamentId === t.id"
                    class="border-t border-gray-100 px-5 py-4 bg-gray-50/50"
                >
                    <div
                        v-if="isLoadingExpanded"
                        class="py-8 text-center text-gray-500"
                    >
                        Chargement…
                    </div>
                    <template v-else>
                        <!-- Teams -->
                        <div class="mb-6">
                            <h3
                                class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2"
                            >
                                Équipes
                            </h3>
                            <div class="flex flex-wrap items-center gap-2">
                                <span
                                    v-for="team in expandedTeams"
                                    :key="team.id"
                                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-sm"
                                >
                                    {{ team.name }}
                                    <button
                                        type="button"
                                        :aria-label="`Retirer l'équipe ${team.name} du tournoi`"
                                        class="text-red-600 hover:text-red-700 cursor-pointer"
                                        @click="
                                            removeTeamFromTournament(
                                                t.id,
                                                team.id
                                            )
                                        "
                                    >
                                        ×
                                    </button>
                                </span>
                                <div
                                    v-if="availableTeamsForExpanded.length"
                                    class="flex items-center gap-2"
                                >
                                    <select
                                        :aria-label="`Ajouter une équipe au tournoi ${t.name}`"
                                        class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                                        :disabled="addingTeamToId === t.id"
                                        @change="
                                            e => {
                                                const v = (
                                                    e.target as HTMLSelectElement
                                                ).value;
                                                if (v) {
                                                    addTeamToTournament(
                                                        t.id,
                                                        Number(v)
                                                    );
                                                    (
                                                        e.target as HTMLSelectElement
                                                    ).value = '';
                                                }
                                            }
                                        "
                                    >
                                        <option value="">
                                            Ajouter une équipe
                                        </option>
                                        <option
                                            v-for="team in availableTeamsForExpanded"
                                            :key="team.id"
                                            :value="team.id"
                                        >
                                            {{ team.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Generate matches -->
                        <div class="mb-6">
                            <ButtonComponent
                                size="sm"
                                :loading="generatingMatchesForId === t.id"
                                :disabled="expandedTeams.length < 2"
                                @click="generateMatches(t.id)"
                            >
                                Générer les matchs
                            </ButtonComponent>
                        </div>

                        <!-- Matches -->
                        <div>
                            <h3
                                class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2"
                            >
                                Matchs
                            </h3>
                            <div
                                v-if="!expandedMatches.length"
                                class="text-sm text-gray-500 py-2"
                            >
                                Aucun match.
                            </div>
                            <div v-else class="space-y-3">
                                <div
                                    v-for="m in expandedMatches"
                                    :key="m.id"
                                    class="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-white border border-gray-200"
                                >
                                    <div
                                        class="flex items-center gap-2 min-w-0 flex-1"
                                    >
                                        <span
                                            class="text-sm font-medium truncate"
                                            >{{ m.homeTeam?.name ?? "?" }}</span
                                        >
                                        <span class="text-gray-400">vs</span>
                                        <span
                                            class="text-sm font-medium truncate"
                                            >{{ m.awayTeam?.name ?? "?" }}</span
                                        >
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            class="w-12 rounded border border-gray-200 px-1.5 py-0.5 text-sm text-center"
                                            :value="m.homeScore"
                                            @change="
                                                e =>
                                                    scheduleSaveMatchScore(
                                                        m,
                                                        Number(
                                                            (
                                                                e.target as HTMLInputElement
                                                            ).value
                                                        ),
                                                        m.awayScore,
                                                        m.result
                                                    )
                                            "
                                        />
                                        <span class="text-gray-400">-</span>
                                        <input
                                            type="number"
                                            min="0"
                                            class="w-12 rounded border border-gray-200 px-1.5 py-0.5 text-sm text-center"
                                            :value="m.awayScore"
                                            @change="
                                                e =>
                                                    scheduleSaveMatchScore(
                                                        m,
                                                        m.homeScore,
                                                        Number(
                                                            (
                                                                e.target as HTMLInputElement
                                                            ).value
                                                        ),
                                                        m.result
                                                    )
                                            "
                                        />
                                    </div>
                                    <select
                                        class="rounded border border-gray-200 px-2 py-0.5 text-sm"
                                        :value="m.result"
                                        @change="
                                                e =>
                                                    scheduleSaveMatchScore(
                                                        m,
                                                        m.homeScore,
                                                        m.awayScore,
                                                        Number(
                                                            (
                                                                e.target as HTMLSelectElement
                                                            ).value
                                                        )
                                                    )
                                            "
                                    >
                                        <option
                                            v-for="opt in RESULT_OPTIONS"
                                            :key="opt.value"
                                            :value="opt.value"
                                        >
                                            {{ opt.label }}
                                        </option>
                                    </select>
                                    <button
                                        type="button"
                                        class="text-sm text-emerald-600 hover:text-emerald-700 cursor-pointer"
                                        @click="startEditMatch(m)"
                                    >
                                        Modifier équipes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <nav
            v-if="totalPages > 1"
            aria-label="Pagination des tournois"
            class="mt-6 flex items-center justify-center gap-4"
        >
            <button
                type="button"
                :disabled="!hasPrev"
                aria-label="Page précédente"
                class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                @click="currentPage--"
            >
                Précédent
            </button>
            <span
                class="text-sm text-gray-500"
                role="status"
                aria-live="polite"
            >
                Page {{ currentPage }} / {{ totalPages }}
            </span>
            <button
                type="button"
                :disabled="!hasNext"
                aria-label="Page suivante"
                class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                @click="currentPage++"
            >
                Suivant
            </button>
        </nav>

        <!-- Create modal -->
        <Teleport to="body">
            <div
                v-if="showCreateModal"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                @click.self="closeCreateModal"
            >
                <div
                    class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="create-tournament-title"
                >
                    <h2
                        id="create-tournament-title"
                        class="text-lg font-bold text-gray-900 mb-4"
                    >
                        Créer un tournoi
                    </h2>
                    <form @submit.prevent="submitCreate" class="space-y-4">
                        <div>
                            <label
                                for="create-name"
                                class="block text-sm font-medium text-gray-700 mb-1"
                                >Nom</label
                            >
                            <input
                                id="create-name"
                                v-model="createForm.name"
                                type="text"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2"
                                placeholder="Tournoi 2026"
                                autofocus
                            />
                        </div>
                        <div>
                            <label
                                for="create-desc"
                                class="block text-sm font-medium text-gray-700 mb-1"
                                >Description</label
                            >
                            <textarea
                                id="create-desc"
                                v-model="createForm.description"
                                rows="2"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2"
                                placeholder="Optionnel"
                            />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label
                                    for="create-start"
                                    class="block text-sm font-medium text-gray-700 mb-1"
                                    >Date début</label
                                >
                                <input
                                    id="create-start"
                                    v-model="createForm.startDate"
                                    type="date"
                                    class="w-full rounded-lg border border-gray-200 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label
                                    for="create-end"
                                    class="block text-sm font-medium text-gray-700 mb-1"
                                    >Date fin</label
                                >
                                <input
                                    id="create-end"
                                    v-model="createForm.endDate"
                                    type="date"
                                    class="w-full rounded-lg border border-gray-200 px-3 py-2"
                                />
                            </div>
                        </div>
                        <p
                            v-if="createError"
                            role="alert"
                            class="text-sm text-red-600"
                        >
                            {{ createError }}
                        </p>
                        <div class="flex gap-2 justify-end">
                            <ButtonComponent
                                type="button"
                                variant="ghost"
                                :disabled="isCreating"
                                @click="closeCreateModal"
                                >Annuler</ButtonComponent
                            >
                            <ButtonComponent type="submit" :loading="isCreating"
                                >Créer</ButtonComponent
                            >
                        </div>
                    </form>
                </div>
            </div>
        </Teleport>

        <!-- Edit match modal -->
        <Teleport to="body">
            <div
                v-if="editingMatchId"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                @click.self="cancelEditMatch"
            >
                <div
                    class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
                    role="dialog"
                    aria-modal="true"
                >
                    <h2 class="text-lg font-bold text-gray-900 mb-4">
                        Modifier le match
                    </h2>
                    <form @submit.prevent="submitEditMatch" class="space-y-4">
                        <div>
                            <label
                                class="block text-sm font-medium text-gray-700 mb-1"
                                >Équipe domicile</label
                            >
                            <select
                                v-model="editMatchForm.homeTeamId"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2"
                                required
                            >
                                <option
                                    v-for="team in editMatchHomeTeamOptions"
                                    :key="team.id"
                                    :value="team.id"
                                >
                                    {{ team.name }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="block text-sm font-medium text-gray-700 mb-1"
                                >Équipe extérieur</label
                            >
                            <select
                                v-model="editMatchForm.awayTeamId"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2"
                                required
                            >
                                <option
                                    v-for="team in editMatchAwayTeamOptions"
                                    :key="team.id"
                                    :value="team.id"
                                >
                                    {{ team.name }}
                                </option>
                            </select>
                        </div>
                        <p
                            v-if="editMatchError"
                            role="alert"
                            class="text-sm text-red-600"
                        >
                            {{ editMatchError }}
                        </p>
                        <div class="flex gap-2 justify-end">
                            <ButtonComponent
                                type="button"
                                variant="ghost"
                                :disabled="isSavingMatch"
                                @click="cancelEditMatch"
                                >Annuler</ButtonComponent
                            >
                            <ButtonComponent
                                type="submit"
                                :loading="isSavingMatch"
                                >Enregistrer</ButtonComponent
                            >
                        </div>
                    </form>
                </div>
            </div>
        </Teleport>
    </div>
</template>
