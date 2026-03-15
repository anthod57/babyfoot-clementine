<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { navLinks } from "@/config/navigation";
import { useAuthStore } from "@/composables/useAuthStore";
import ButtonComponent from "./ButtonComponent.vue";

const router = useRouter();
const { user, isAuthenticated, isAdmin, initials, logout } = useAuthStore();

const isMenuOpen = ref(false);
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const adminLinks = [
    { label: "Gestion des tournois", to: "/admin/tournaments" },
    { label: "Gestion des équipes", to: "/admin/teams" },
    { label: "Gestion des utilisateurs", to: "/admin/users" },
];

const visibleAdminLinks = computed(() => (isAdmin.value ? adminLinks : []));

/** Bascule l'affichage du menu mobile. */
function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
}

/** Ferme le menu mobile. */
function closeMenu() {
    isMenuOpen.value = false;
}

function toggleDropdown() {
    isDropdownOpen.value = !isDropdownOpen.value;
}

/** Ferme le menu déroulant utilisateur. */
function closeDropdown() {
    isDropdownOpen.value = false;
}

/** Déconnecte l'utilisateur et redirige vers l'accueil. */
function handleLogout() {
    logout();
    closeDropdown();
    closeMenu();
    router.push("/");
}

/**
 * Ferme le dropdown si le clic est en dehors de la zone.
 * @param {MouseEvent} e
 */
function handleClickOutside(e: MouseEvent) {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
        closeDropdown();
    }
}

onMounted(() => {
    document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
    <nav aria-label="Navigation principale" class="bg-white shadow-md relative">
        <a
            href="#main-content"
            class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:font-medium"
        >
            Aller au contenu
        </a>

        <div class="max-w-6xl mx-auto px-4">
            <div class="flex items-center justify-between h-16">
                <!-- Logo -->
                <RouterLink
                    to="/"
                    class="flex items-center gap-2 text-emerald-600 font-bold text-xl shrink-0"
                    aria-label="FFBF - Accueil"
                >
                    <span aria-hidden="true" class="text-2xl">⚽</span>
                    <span>FFBF</span>
                </RouterLink>

                <!-- Desktop nav -->
                <ul class="hidden md:flex items-center gap-1" role="list">
                    <li v-for="link in navLinks" :key="link.to">
                        <RouterLink
                            :to="link.to"
                            class="px-4 py-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 font-medium transition-colors duration-200"
                            active-class="text-emerald-600 bg-emerald-50"
                        >
                            {{ link.label }}
                        </RouterLink>
                    </li>
                </ul>

                <!-- Desktop auth: login or user dropdown -->
                <div class="hidden md:block relative" ref="dropdownRef">
                    <RouterLink v-if="!isAuthenticated" to="/connexion">
                        <ButtonComponent
                            variant="primary"
                            size="lg"
                            class="h-10"
                        >
                            Connexion
                        </ButtonComponent>
                    </RouterLink>
                    <div v-else class="relative">
                        <button
                            type="button"
                            @click.prevent="toggleDropdown"
                            :aria-expanded="isDropdownOpen"
                            aria-haspopup="true"
                            aria-label="Menu utilisateur"
                            class="flex items-center justify-center size-10 cursor-pointer rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm hover:bg-emerald-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                        >
                            {{ initials }}
                        </button>
                        <div
                            v-show="isDropdownOpen"
                            class="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg py-1 z-50"
                            role="menu"
                        >
                            <p
                                class="px-4 py-2 text-xs text-gray-500 border-b border-gray-100"
                            >
                                {{ user?.name }} {{ user?.surname }}
                            </p>
                            <RouterLink
                                v-for="link in visibleAdminLinks"
                                :key="link.to"
                                :to="link.to"
                                @click="closeDropdown"
                                class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                role="menuitem"
                            >
                                {{ link.label }}
                            </RouterLink>
                            <button
                                type="button"
                                @click="handleLogout"
                                class="w-full cursor-pointer text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                                role="menuitem"
                            >
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Burger button -->
                <button
                    class="md:hidden flex flex-col justify-center items-center size-10 rounded-lg hover:bg-gray-100 transition-colors duration-200 gap-1.5 cursor-pointer"
                    :aria-expanded="isMenuOpen"
                    :aria-label="
                        isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'
                    "
                    aria-controls="mobile-menu"
                    @click="toggleMenu"
                >
                    <span
                        class="block w-5 h-0.5 bg-gray-700 transition-all duration-300 origin-center"
                        :class="isMenuOpen ? 'translate-y-2 rotate-45' : ''"
                        aria-hidden="true"
                    />
                    <span
                        class="block w-5 h-0.5 bg-gray-700 transition-all duration-300"
                        :class="isMenuOpen ? 'opacity-0 scale-x-0' : ''"
                        aria-hidden="true"
                    />
                    <span
                        class="block w-5 h-0.5 bg-gray-700 transition-all duration-300 origin-center"
                        :class="isMenuOpen ? '-translate-y-2 -rotate-45' : ''"
                        aria-hidden="true"
                    />
                </button>
            </div>
        </div>

        <!-- Mobile menu -->
        <div
            id="mobile-menu"
            class="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-100 overflow-hidden transition-all duration-300 z-50"
            :class="isMenuOpen ? 'max-h-112' : 'max-h-0'"
            :aria-hidden="!isMenuOpen"
            :inert="!isMenuOpen || undefined"
        >
            <ul class="px-4 py-3 flex flex-col gap-1" role="list">
                <li v-for="link in navLinks" :key="link.to">
                    <RouterLink
                        :to="link.to"
                        class="block px-4 py-2.5 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 font-medium transition-colors duration-200"
                        active-class="text-emerald-600 bg-emerald-50"
                        @click="closeMenu"
                    >
                        {{ link.label }}
                    </RouterLink>
                </li>
            </ul>
            <!-- Mobile auth -->
            <div class="px-4 py-3 border-t border-gray-100">
                <RouterLink
                    v-if="!isAuthenticated"
                    to="/connexion"
                    class="block px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-center hover:bg-emerald-700 transition-colors duration-200"
                    @click="closeMenu"
                >
                    Connexion
                </RouterLink>
                <div v-else>
                    <p
                        class="px-4 py-2 text-sm text-gray-500 flex items-center gap-2"
                    >
                        <span
                            class="flex items-center justify-center size-8 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-xs shrink-0"
                        >
                            {{ initials }}
                        </span>
                        {{ user?.name }} {{ user?.surname }}
                    </p>
                    <ul class="flex flex-col gap-1 mt-1" role="list">
                        <li v-for="link in visibleAdminLinks" :key="link.to">
                            <RouterLink
                                :to="link.to"
                                class="block px-4 py-2.5 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 font-medium transition-colors duration-200"
                                @click="closeMenu"
                            >
                                {{ link.label }}
                            </RouterLink>
                        </li>
                        <li>
                            <button
                                type="button"
                                @click="handleLogout"
                                class="block w-full text-left px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors duration-200 cursor-pointer"
                            >
                                Déconnexion
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </nav>
</template>
