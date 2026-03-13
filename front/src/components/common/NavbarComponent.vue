<script setup lang="ts">
import { ref } from 'vue'

const isMenuOpen = ref(false)

const links = [
  { label: 'Accueil', href: '' },
  { label: 'Matchs', href: '#' },
  { label: 'Classement', href: '#' },
  { label: 'Équipes', href: '#' },
]

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}
</script>

<template>
  <nav class="bg-white shadow-md relative">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <a href="#" class="flex items-center gap-2 text-emerald-600 font-bold text-xl shrink-0">
          <span class="text-2xl">⚽</span>
          <span>Babyfoot</span>
        </a>

        <!-- Desktop links -->
        <ul class="hidden md:flex items-center gap-1">
          <li v-for="link in links" :key="link.label">
            <a
              :href="link.href"
              class="px-4 py-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 font-medium transition-colors duration-200"
            >
              {{ link.label }}
            </a>
          </li>
        </ul>

        <!-- Login Desktop -->
        <div class="hidden md:block">
          <a
            href="#"
            class="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200"
          >
            Connexion
          </a>
        </div>

        <!-- Burger button -->
        <button
          class="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors duration-200 gap-1.5"
          :aria-expanded="isMenuOpen"
          aria-label="Menu"
          @click="toggleMenu"
        >
          <span
            class="block w-5 h-0.5 bg-gray-700 transition-all duration-300 origin-center"
            :class="isMenuOpen ? 'translate-y-2 rotate-45' : ''"
          />
          <span
            class="block w-5 h-0.5 bg-gray-700 transition-all duration-300"
            :class="isMenuOpen ? 'opacity-0 scale-x-0' : ''"
          />
          <span
            class="block w-5 h-0.5 bg-gray-700 transition-all duration-300 origin-center"
            :class="isMenuOpen ? '-translate-y-2 -rotate-45' : ''"
          />
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div
      class="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-100 overflow-hidden transition-all duration-300 z-50"
      :class="isMenuOpen ? 'max-h-96' : 'max-h-0'"
    >
      <ul class="px-4 py-3 flex flex-col gap-1">
        <li v-for="link in links" :key="link.label">
          <a
            :href="link.href"
            class="block px-4 py-2.5 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 font-medium transition-colors duration-200"
            @click="closeMenu"
          >
            {{ link.label }}
          </a>
        </li>
        <li class="mt-2 pt-2 border-t border-gray-100">
          <a
            href="#"
            class="block px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-center hover:bg-emerald-700 transition-colors duration-200"
            @click="closeMenu"
          >
            Connexion
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>
