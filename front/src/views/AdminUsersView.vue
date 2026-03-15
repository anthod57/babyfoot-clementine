<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterLink } from "vue-router";
import BackLink from "@/components/common/BackLink.vue";
import { useQuery } from "@/composables/useQuery";
import { useAuthStore } from "@/composables/useAuthStore";
import { apiFetch, usersApi } from "@/api";
import type { User } from "@/types/api";
import { getErrorMessage } from "@/utils/error";
import { formatUserDisplayName, compareUsersByName } from "@/utils/user";
import ButtonComponent from "@/components/common/ButtonComponent.vue";

const {
    data: users,
    isPending,
    refresh: refreshUsers,
} = useQuery(signal => apiFetch<User[]>("/users", { signal }));

const sortedUsers = computed(() =>
    [...(users.value ?? [])].sort(compareUsersByName)
);

const { user: currentUser } = useAuthStore();
const isCurrentUser = (u: User) => currentUser.value?.id === u.id;

const showCreateModal = ref(false);
const createForm = ref({
    username: "",
    name: "",
    surname: "",
    email: "",
    password: "",
});
const createError = ref("");
const isCreating = ref(false);

/**
 * Opens the create modal and resets the form.
 * @returns {void}
 */
function openCreateModal(): void {
    createForm.value = {
        username: "",
        name: "",
        surname: "",
        email: "",
        password: "",
    };
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

/**
 * Creates a new user from the form data.
 * @returns {Promise<void>}
 */
async function submitCreate(): Promise<void> {
    createError.value = "";
    const { username, name, surname, email, password } = createForm.value;

    if (
        !username.trim() ||
        !name.trim() ||
        !surname.trim() ||
        !email.trim() ||
        !password
    ) {
        createError.value = "Tous les champs sont requis.";
        return;
    }

    if (password.length < 8) {
        createError.value =
            "Le mot de passe doit contenir au moins 8 caractères.";
        return;
    }

    isCreating.value = true;
    try {
        await usersApi.create({
            username: username.trim(),
            name: name.trim(),
            surname: surname.trim(),
            email: email.trim(),
            password,
        });
        closeCreateModal();
        refreshUsers();
    } catch (e) {
        createError.value = getErrorMessage(e, "Erreur lors de la création.");
    } finally {
        isCreating.value = false;
    }
}

const editingUserId = ref<number | null>(null);
const editForm = ref({
    username: "",
    name: "",
    surname: "",
    email: "",
    password: "",
});
const isSaving = ref(false);
const editError = ref("");

/**
 * Enters edit mode for the given user.
 * @param {User} u
 * @returns {void}
 */
function startEdit(u: User): void {
    editingUserId.value = u.id;
    editForm.value = {
        username: u.username,
        name: u.name,
        surname: u.surname,
        email: u.email,
        password: "",
    };
    editError.value = "";
}

/**
 * Cancels edit mode.
 * @returns {void}
 */
function cancelEdit(): void {
    editingUserId.value = null;
}

/**
 * Saves the user changes.
 * @returns {Promise<void>}
 */
async function submitEdit(): Promise<void> {
    if (!editingUserId.value) return;

    editError.value = "";
    const { username, name, surname, email, password } = editForm.value;

    if (!username.trim() || !name.trim() || !surname.trim() || !email.trim()) {
        editError.value = "Tous les champs sont requis.";
        return;
    }

    if (password.length > 0 && password.length < 8) {
        editError.value =
            "Le mot de passe doit contenir au moins 8 caractères.";
        return;
    }

    isSaving.value = true;
    try {
        const payload: {
            username: string;
            name: string;
            surname: string;
            email: string;
            password?: string;
        } = {
            username: username.trim(),
            name: name.trim(),
            surname: surname.trim(),
            email: email.trim(),
        };
        if (password) payload.password = password;

        await usersApi.update(editingUserId.value, payload);
        cancelEdit();
        refreshUsers();
    } catch (e) {
        editError.value = getErrorMessage(e, "Erreur lors de la modification.");
    } finally {
        isSaving.value = false;
    }
}

const deletingUserId = ref<number | null>(null);
const isDeleting = ref(false);

/**
 * Deletes the user after confirmation. Prevents self-deletion.
 * @param {User} u
 * @returns {Promise<void>}
 */
async function confirmDelete(u: User): Promise<void> {
    if (isCurrentUser(u)) {
        alert("Vous ne pouvez pas supprimer votre propre compte.");
        return;
    }

    const displayName = formatUserDisplayName(u);

    if (!confirm(`Supprimer l'utilisateur « ${displayName} » ?`)) return;

    isDeleting.value = true;
    deletingUserId.value = u.id;
    try {
        await usersApi.delete(u.id);
        refreshUsers();
    } catch (e) {
        alert(getErrorMessage(e, "Erreur lors de la suppression."));
    } finally {
        isDeleting.value = false;
        deletingUserId.value = null;
    }
}
</script>

<template>
    <div
        class="w-full max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 py-8 lg:px-6 xl:px-8"
    >
        <BackLink fallback="/" />

        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 class="text-2xl font-bold text-gray-900">
                Gestion des utilisateurs
            </h1>
            <ButtonComponent @click="openCreateModal"
                >Créer un utilisateur</ButtonComponent
            >
        </div>

        <div
            v-if="isPending"
            class="space-y-4"
            aria-busy="true"
            aria-label="Chargement des utilisateurs"
        >
            <div
                v-for="i in 4"
                :key="i"
                class="h-20 bg-gray-100 rounded-xl animate-pulse"
            />
        </div>

        <div
            v-else-if="!sortedUsers.length"
            class="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200"
            role="status"
        >
            Aucun utilisateur.
        </div>

        <div v-else class="space-y-4">
            <div
                v-for="u in sortedUsers"
                :key="u.id"
                class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
                <div class="px-5 py-4">
                    <template v-if="editingUserId === u.id">
                        <form @submit.prevent="submitEdit" class="space-y-3">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label
                                        for="edit-username"
                                        class="block text-xs font-medium text-gray-500 mb-0.5"
                                        >Identifiant</label
                                    >
                                    <input
                                        id="edit-username"
                                        v-model="editForm.username"
                                        type="text"
                                        class="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label
                                        for="edit-email"
                                        class="block text-xs font-medium text-gray-500 mb-0.5"
                                        >Email</label
                                    >
                                    <input
                                        id="edit-email"
                                        v-model="editForm.email"
                                        type="email"
                                        class="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label
                                        for="edit-name"
                                        class="block text-xs font-medium text-gray-500 mb-0.5"
                                        >Prénom</label
                                    >
                                    <input
                                        id="edit-name"
                                        v-model="editForm.name"
                                        type="text"
                                        class="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label
                                        for="edit-surname"
                                        class="block text-xs font-medium text-gray-500 mb-0.5"
                                        >Nom</label
                                    >
                                    <input
                                        id="edit-surname"
                                        v-model="editForm.surname"
                                        type="text"
                                        class="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div class="sm:col-span-2">
                                    <label
                                        for="edit-password"
                                        class="block text-xs font-medium text-gray-500 mb-0.5"
                                        >Nouveau mot de passe (laisser vide pour
                                        ne pas modifier)</label
                                    >
                                    <input
                                        id="edit-password"
                                        v-model="editForm.password"
                                        type="password"
                                        autocomplete="new-password"
                                        class="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <p v-if="editError" class="text-sm text-red-600">
                                {{ editError }}
                            </p>
                            <div class="flex gap-2">
                                <ButtonComponent
                                    size="sm"
                                    :loading="isSaving"
                                    type="submit"
                                    >Enregistrer</ButtonComponent
                                >
                                <ButtonComponent
                                    size="sm"
                                    variant="ghost"
                                    :disabled="isSaving"
                                    type="button"
                                    @click="cancelEdit"
                                    >Annuler</ButtonComponent
                                >
                            </div>
                        </form>
                    </template>
                    <template v-else>
                        <div
                            class="flex flex-wrap items-start justify-between gap-3"
                        >
                            <div>
                                <h2 class="text-lg font-semibold text-gray-900">
                                    {{ formatUserDisplayName(u) }}
                                </h2>
                                <p class="text-sm text-gray-600">
                                    {{ u.username }}
                                </p>
                                <p class="text-sm text-gray-500">
                                    {{ u.email }}
                                </p>
                                <span
                                    v-if="
                                        (u.roles as string[] | undefined)
                                            ?.length
                                    "
                                    class="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700"
                                >
                                    {{
                                        Array.isArray(u.roles)
                                            ? u.roles.join(", ")
                                            : ""
                                    }}
                                </span>
                            </div>
                            <div class="flex gap-2">
                                <button
                                    type="button"
                                    :aria-label="`Modifier l'utilisateur ${formatUserDisplayName(u)}`"
                                    class="text-sm text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                                    @click="startEdit(u)"
                                >
                                    Modifier
                                </button>
                                <button
                                    type="button"
                                    :aria-label="`Supprimer l'utilisateur ${formatUserDisplayName(u)}`"
                                    class="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                    :disabled="
                                        (isDeleting &&
                                            deletingUserId === u.id) ||
                                        isCurrentUser(u)
                                    "
                                    @click="confirmDelete(u)"
                                >
                                    {{
                                        isDeleting && deletingUserId === u.id
                                            ? "Suppression…"
                                            : "Supprimer"
                                    }}
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <!-- Create modal -->
        <Teleport to="body">
            <div
                v-if="showCreateModal"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                @click.self="closeCreateModal"
            >
                <div
                    class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="create-user-title"
                >
                    <h2
                        id="create-user-title"
                        class="text-lg font-bold text-gray-900 mb-4"
                    >
                        Créer un utilisateur
                    </h2>
                    <form @submit.prevent="submitCreate" class="space-y-4">
                        <div>
                            <label
                                for="create-username"
                                class="block text-sm font-medium text-gray-700 mb-1"
                                >Identifiant</label
                            >
                            <input
                                id="create-username"
                                v-model="createForm.username"
                                type="text"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="jdupont"
                                autofocus
                            />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label
                                    for="create-name"
                                    class="block text-sm font-medium text-gray-700 mb-1"
                                    >Prénom</label
                                >
                                <input
                                    id="create-name"
                                    v-model="createForm.name"
                                    type="text"
                                    class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Jean"
                                />
                            </div>
                            <div>
                                <label
                                    for="create-surname"
                                    class="block text-sm font-medium text-gray-700 mb-1"
                                    >Nom</label
                                >
                                <input
                                    id="create-surname"
                                    v-model="createForm.surname"
                                    type="text"
                                    class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Dupont"
                                />
                            </div>
                        </div>
                        <div>
                            <label
                                for="create-email"
                                class="block text-sm font-medium text-gray-700 mb-1"
                                >Email</label
                            >
                            <input
                                id="create-email"
                                v-model="createForm.email"
                                type="email"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="jean.dupont@example.com"
                            />
                        </div>
                        <div>
                            <label
                                for="create-password"
                                class="block text-sm font-medium text-gray-700 mb-1"
                                >Mot de passe</label
                            >
                            <input
                                id="create-password"
                                v-model="createForm.password"
                                type="password"
                                autocomplete="new-password"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Min. 8 caractères"
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
