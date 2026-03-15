<script setup lang="ts">
import { ref } from "vue";
import { navLinks } from "@/config/navigation";
import ButtonComponent from "./ButtonComponent.vue";

const isMenuOpen = ref(false);

function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
    isMenuOpen.value = false;
}
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

                <!-- Desktop -->
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

                <!-- Desktop login button-->
                <div class="hidden md:block">
                    <RouterLink to="/connexion">
                        <ButtonComponent
                            variant="primary"
                            size="lg"
                            class="h-10"
                            >Connexion</ButtonComponent
                        >
                    </RouterLink>
                </div>

                <!-- Burger button -->
                <button
                    class="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors duration-200 gap-1.5"
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

        <!-- Mobile -->
        <div
            id="mobile-menu"
            class="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-100 overflow-hidden transition-all duration-300 z-50"
            :class="isMenuOpen ? 'max-h-96' : 'max-h-0'"
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
                <li class="mt-2 pt-2 border-t border-gray-100">
                    <RouterLink
                        to="/connexion"
                        class="block px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-center hover:bg-emerald-700 transition-colors duration-200"
                        @click="closeMenu"
                    >
                        Connexion
                    </RouterLink>
                </li>
            </ul>
        </div>
    </nav>
</template>
