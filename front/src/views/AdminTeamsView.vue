<script setup lang="ts">
import { ref, computed } from "vue";
import BackLink from "@/components/common/BackLink.vue";
import { useQuery } from "@/composables/useQuery";
import { useDebouncedRef } from "@/composables/useDebouncedRef";
import { apiFetch, teamsApi } from "@/api";
import type { Team, User } from "@/types/api";
import { getErrorMessage } from "@/utils/error";
import { formatUserDisplayName, compareUsersByName } from "@/utils/user";
import ButtonComponent from "@/components/common/ButtonComponent.vue";

const TEAMS_PER_PAGE = 10;

const currentPage = ref(1);
const searchInput = ref("");
const searchQuery = useDebouncedRef(searchInput, 300);

const {
    data: teamsResponse,
    isPending: teamsPending,
    refresh: refreshTeams,
} = useQuery(
    signal =>
        teamsApi.getAllPaginated({
            page: currentPage.value,
            limit: TEAMS_PER_PAGE,
            search: searchQuery.value.trim() || undefined,
            signal,
        }),
    { watch: [currentPage, searchQuery] }
);

/**
 * Updates team in local state without refetch (add/remove player).
 * @param {number} teamId
 * @param {(team: Team) => Team} updater
 * @returns {void}
 */
function updateTeamLocally(
    teamId: number,
    updater: (team: Team) => Team
): void {
    const res = teamsResponse.value;

    if (!res?.data) return;

    teamsResponse.value = {
        ...res,
        data: res.data.map(t => (t.id === teamId ? updater(t) : t)),
    };
}

const teams = computed(() => teamsResponse.value?.data ?? []);
const totalTeams = computed(() => teamsResponse.value?.total ?? 0);
const totalPages = computed(
    () => Math.ceil(totalTeams.value / TEAMS_PER_PAGE) || 1
);
const hasPrev = computed(() => currentPage.value > 1);
const hasNext = computed(() => currentPage.value < totalPages.value);

const { data: allUsers, isPending: usersPending } = useQuery(signal =>
    apiFetch<User[]>("/users", { signal })
);

const isPending = computed(() => teamsPending.value || usersPending.value);

const showCreateModal = ref(false);
const createName = ref("");
const createError = ref("");
const isCreating = ref(false);

/**
 * Opens the create modal and resets form state.
 * @returns {void}
 */
function openCreateModal(): void {
    createName.value = "";
    createError.value = "";
    showCreateModal.value = true;
}

/**
 * Closes the create modal.
 * @returns {void}
 */
function closeCreateModal(): void {
    showCreateModal.value = false;
}

/** @returns {Promise<void>} */
async function submitCreate(): Promise<void> {
    createError.value = "";
    const name = createName.value.trim();

    if (!name) {
        createError.value = "Le nom est requis.";
        return;
    }

    isCreating.value = true;
    try {
        await teamsApi.create({ name });
        closeCreateModal();
        currentPage.value = 1;
        refreshTeams();
    } catch (e) {
        createError.value = getErrorMessage(e, "Erreur lors de la création.");
    } finally {
        isCreating.value = false;
    }
}

const editingTeamId = ref<number | null>(null);
const editName = ref("");
const isSaving = ref(false);
const editError = ref("");

/**
 * @param {Team} team
 * @returns {void}
 */
function startEdit(team: Team): void {
    editingTeamId.value = team.id;
    editName.value = team.name;
    editError.value = "";
}

/**
 * Cancels edit mode and closes the form.
 * @returns {void}
 */
function cancelEdit(): void {
    editingTeamId.value = null;
}

async function submitEdit() {
    if (!editingTeamId.value) return;
    editError.value = "";
    const name = editName.value.trim();
    if (!name) {
        editError.value = "Le nom est requis.";
        return;
    }
    isSaving.value = true;
    try {
        await teamsApi.update(editingTeamId.value, { name });
        cancelEdit();
        refreshTeams();
    } catch (e) {
        editError.value = getErrorMessage(e, "Erreur lors de la modification.");
    } finally {
        isSaving.value = false;
    }
}

const deletingTeamId = ref<number | null>(null);
const isDeleting = ref(false);

/**
 * @param {Team} team
 * @returns {Promise<void>}
 */
async function confirmDelete(team: Team): Promise<void> {
    if (!confirm(`Supprimer l'équipe « ${team.name} » ?`)) return;

    isDeleting.value = true;
    deletingTeamId.value = team.id;
    try {
        await teamsApi.delete(team.id);
        if (teams.value.length === 1 && currentPage.value > 1)
            currentPage.value--;
        refreshTeams();
    } catch (e) {
        alert(getErrorMessage(e, "Erreur lors de la suppression."));
    } finally {
        isDeleting.value = false;
        deletingTeamId.value = null;
    }
}

/**
 * Returns team members with display names, sorted by name.
 * @param {Team} team
 * @returns {{ id: number; displayName: string }[]}
 */
function getTeamMembers(team: Team): { id: number; displayName: string }[] {
    const u = team.users ?? [];
    return u
        .map(
            (x: {
                id: number;
                fullName?: string;
                name?: string;
                surname?: string;
            }) => ({
                id: x.id,
                displayName: formatUserDisplayName(x),
            })
        )
        .sort((a, b) => a.displayName.localeCompare(b.displayName, "fr"));
}

/**
 * Returns users not yet in the team, sorted by name.
 * @param {Team} team
 * @returns {User[]}
 */
function availableUsers(team: Team): User[] {
    const members = getTeamMembers(team);
    const memberIds = new Set(members.map(m => m.id));
    return (allUsers.value ?? [])
        .filter(u => !memberIds.has(u.id))
        .sort(compareUsersByName);
}

const addingToTeamId = ref<number | null>(null);
const isAddingPlayer = ref(false);

/**
 * Adds a user to the team.
 * @param {number} teamId
 * @param {number} userId
 * @returns {Promise<void>}
 */
async function addPlayer(teamId: number, userId: number): Promise<void> {
    isAddingPlayer.value = true;
    addingToTeamId.value = teamId;

    try {
        const updatedTeam = await teamsApi.addUser(teamId, userId);
        updateTeamLocally(teamId, () => updatedTeam);
    } catch (e) {
        alert(getErrorMessage(e, "Erreur lors de l'ajout."));
    } finally {
        isAddingPlayer.value = false;
        addingToTeamId.value = null;
    }
}

/**
 * Removes a user from the team.
 * @param {number} teamId
 * @param {number} userId
 * @returns {Promise<void>}
 */
async function removePlayer(teamId: number, userId: number): Promise<void> {
    try {
        await teamsApi.removeUser(teamId, userId);
        updateTeamLocally(teamId, team => ({
            ...team,
            users: (team.users ?? []).filter(u => u.id !== userId),
        }));
    } catch (e) {
        alert(getErrorMessage(e, "Erreur lors de la suppression."));
    }
}
</script>

<template>
    <div
        class="w-full max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 py-8 lg:px-6 xl:px-8"
    >
        <!-- Back link -->
        <BackLink fallback="/" />

        <!-- Header -->
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 class="text-2xl font-bold text-gray-900">
                Gestion des équipes
            </h1>
            <div class="flex flex-wrap items-center gap-3">
                <input
                    v-model="searchInput"
                    type="search"
                    placeholder="Rechercher par nom…"
                    aria-label="Rechercher une équipe par nom"
                    class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-48"
                    @input="currentPage = 1"
                />
                <ButtonComponent @click="openCreateModal">
                    Créer une équipe
                </ButtonComponent>
            </div>
        </div>

        <!-- Loading -->
        <div
            v-if="isPending"
            class="space-y-4"
            aria-busy="true"
            aria-label="Chargement des équipes"
        >
            <div
                v-for="i in 4"
                :key="i"
                class="h-24 bg-gray-100 rounded-xl animate-pulse"
            />
        </div>

        <!-- Empty -->
        <div
            v-else-if="!teams?.length"
            class="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200"
            role="status"
        >
            Aucune équipe. Créez-en une pour commencer.
        </div>

        <!-- Team list -->
        <div v-else class="space-y-4">
            <div
                v-for="team in teams"
                :key="team.id"
                class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
                <div
                    class="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3"
                >
                    <!-- Team name (edit or display) -->
                    <div class="flex-1 min-w-0">
                        <template v-if="editingTeamId === team.id">
                            <div class="flex flex-wrap items-center gap-2">
                                <input
                                    v-model="editName"
                                    type="text"
                                    :aria-label="`Modifier le nom de l'équipe ${team.name}`"
                                    class="flex-1 min-w-48 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Nom de l'équipe"
                                    @keydown.enter="submitEdit"
                                    @keydown.escape="cancelEdit"
                                />
                                <div class="flex gap-1">
                                    <ButtonComponent
                                        size="sm"
                                        :loading="isSaving"
                                        @click="submitEdit"
                                    >
                                        Enregistrer
                                    </ButtonComponent>
                                    <ButtonComponent
                                        size="sm"
                                        variant="ghost"
                                        :disabled="isSaving"
                                        @click="cancelEdit"
                                    >
                                        Annuler
                                    </ButtonComponent>
                                </div>
                            </div>
                            <p
                                v-if="editError"
                                role="alert"
                                class="mt-1 text-sm text-red-600"
                            >
                                {{ editError }}
                            </p>
                        </template>
                        <template v-else>
                            <h2 class="text-lg font-semibold text-gray-900">
                                {{ team.name }}
                            </h2>
                            <div class="flex gap-2 mt-1">
                                <button
                                    type="button"
                                    :aria-label="`Modifier l'équipe ${team.name}`"
                                    class="text-sm text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                                    @click="startEdit(team)"
                                >
                                    Modifier
                                </button>
                                <button
                                    type="button"
                                    :aria-label="`Supprimer l'équipe ${team.name}`"
                                    class="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer disabled:cursor-not-allowed"
                                    :disabled="
                                        isDeleting && deletingTeamId === team.id
                                    "
                                    @click="confirmDelete(team)"
                                >
                                    {{
                                        isDeleting && deletingTeamId === team.id
                                            ? "Suppression…"
                                            : "Supprimer"
                                    }}
                                </button>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- Players -->
                <div class="px-5 py-4">
                    <h3
                        class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3"
                    >
                        Joueurs
                    </h3>
                    <ul
                        v-if="getTeamMembers(team).length"
                        class="space-y-2 mb-4"
                    >
                        <li
                            v-for="member in getTeamMembers(team)"
                            :key="member.id"
                            class="flex items-center justify-between gap-2 py-1.5"
                        >
                            <span class="text-sm text-gray-700">{{
                                member.displayName || `Joueur #${member.id}`
                            }}</span>
                            <button
                                type="button"
                                :aria-label="`Retirer ${member.displayName || 'ce joueur'} de l'équipe`"
                                class="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                                @click="removePlayer(team.id, member.id)"
                            >
                                Retirer
                            </button>
                        </li>
                    </ul>
                    <p v-else class="text-sm text-gray-400 mb-4">
                        Aucun joueur.
                    </p>

                    <!-- Add player -->
                    <div
                        v-if="availableUsers(team).length"
                        class="flex flex-wrap items-center gap-2"
                    >
                        <label
                            :for="`add-${team.id}`"
                            class="text-sm text-gray-600"
                        >
                            Ajouter :
                        </label>
                        <select
                            :id="`add-${team.id}`"
                            :aria-label="`Ajouter un joueur à l'équipe ${team.name}`"
                            class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-48"
                            :disabled="
                                isAddingPlayer && addingToTeamId === team.id
                            "
                            @change="
                                e => {
                                    const val = (e.target as HTMLSelectElement)
                                        .value;
                                    if (val) {
                                        addPlayer(team.id, Number(val));
                                        (e.target as HTMLSelectElement).value =
                                            '';
                                    }
                                }
                            "
                        >
                            <option value="">Sélectionner un joueur</option>
                            <option
                                v-for="u in availableUsers(team)"
                                :key="u.id"
                                :value="u.id"
                            >
                                {{ u.name }} {{ u.surname }} ({{ u.email }})
                            </option>
                        </select>
                        <span
                            v-if="isAddingPlayer && addingToTeamId === team.id"
                            class="text-xs text-gray-400"
                        >
                            Ajout…
                        </span>
                    </div>
                    <p v-else class="text-xs text-gray-400">
                        Tous les joueurs sont déjà dans cette équipe.
                    </p>
                </div>
            </div>
        </div>

        <nav
            v-if="totalPages > 1"
            aria-label="Pagination des équipes"
            class="mt-6 flex items-center justify-center gap-4"
        >
            <button
                type="button"
                :disabled="!hasPrev"
                aria-label="Page précédente"
                class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
                class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                @click="currentPage++"
            >
                Suivant
            </button>
        </nav>

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
                    aria-labelledby="create-team-title"
                >
                    <h2
                        id="create-team-title"
                        class="text-lg font-bold text-gray-900 mb-4"
                    >
                        Créer une équipe
                    </h2>
                    <form @submit.prevent="submitCreate" class="space-y-4">
                        <div>
                            <label
                                for="create-name"
                                class="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Nom
                            </label>
                            <input
                                id="create-name"
                                v-model="createName"
                                type="text"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Nom de l'équipe"
                                autofocus
                            />
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
                            >
                                Annuler
                            </ButtonComponent>
                            <ButtonComponent
                                type="submit"
                                :loading="isCreating"
                            >
                                Créer
                            </ButtonComponent>
                        </div>
                    </form>
                </div>
            </div>
        </Teleport>
    </div>
</template>
