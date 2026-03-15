<script setup lang="ts">
withDefaults(
    defineProps<{
        variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
        size?: "sm" | "md" | "lg";
        disabled?: boolean;
        loading?: boolean;
        type?: "button" | "submit" | "reset";
        full?: boolean;
        ariaLabel?: string;
    }>(),
    {
        variant: "primary",
        size: "md",
        disabled: false,
        loading: false,
        type: "button",
        full: false,
        ariaLabel: undefined,
    }
);

defineEmits<{ click: [event: MouseEvent] }>();
</script>

<template>
    <button
        :type="type"
        :disabled="disabled || loading"
        :aria-busy="loading || undefined"
        :aria-disabled="disabled || loading || undefined"
        :aria-label="ariaLabel ?? undefined"
        :class="[
            'cursor-pointer inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none',
            size === 'sm' && 'px-3 py-1.5 text-sm',
            size === 'md' && 'px-4 py-2 text-sm',
            size === 'lg' && 'px-6 py-3 text-base',
            variant === 'primary' &&
                'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500 active:scale-[0.98]',
            variant === 'secondary' &&
                'bg-gray-100 text-gray-800 hover:bg-gray-200 focus-visible:ring-gray-400 active:scale-[0.98]',
            variant === 'outline' &&
                'border border-emerald-600 text-emerald-600 hover:bg-emerald-50 focus-visible:ring-emerald-500 active:scale-[0.98]',
            variant === 'ghost' &&
                'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400 active:scale-[0.98]',
            variant === 'danger' &&
                'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 active:scale-[0.98]',
            (disabled || loading) &&
                'opacity-50 cursor-not-allowed active:scale-100',
            full && 'w-full',
        ]"
        @click="$emit('click', $event)"
    >
        <!-- Spinner loading -->
        <svg
            v-if="loading"
            aria-hidden="true"
            class="animate-spin shrink-0"
            :class="size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
            />
            <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
        </svg>
        <!-- Loading -->
        <span v-if="loading" class="sr-only">Chargement…</span>

        <slot name="icon-left" />
        <slot />
        <slot name="icon-right" />
    </button>
</template>
