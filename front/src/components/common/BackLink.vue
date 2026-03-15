<script setup lang="ts">
import { useRouter } from "vue-router";

const props = withDefaults(
    defineProps<{
        /** Route de repli si l'historique est vide (ex: entrée directe par URL). */
        fallback?: string;
        /** Libellé du lien (pour l'accessibilité et le contenu). */
        label?: string;
        /** Classes CSS additionnelles. */
        customClass?: string;
    }>(),
    {
        fallback: "/",
        label: "Retour",
    }
);

const router = useRouter();

function goBack() {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push(props.fallback);
    }
}
</script>

<template>
    <button
        type="button"
        :aria-label="`${props.label} à la page précédente`"
        :class="[
            'inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer mb-6',
            props.customClass ?? '',
        ]"
        @click="goBack"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 19l-7-7 7-7"
            />
        </svg>
        {{ props.label }}
    </button>
</template>
