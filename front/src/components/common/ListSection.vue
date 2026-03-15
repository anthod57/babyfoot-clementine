<script setup lang="ts">
defineProps<{
    title: string;
    headingId: string;
    showTitle?: boolean;
    isPending?: boolean;
    isEmpty?: boolean;
    emptyMessage?: string;
}>();

const selectedDate = defineModel<string>("date", { default: "" });
</script>

<template>
    <section :aria-labelledby="headingId" class="mx-auto w-full px-4 py-1">
        <!-- Header -->
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2
                v-if="showTitle !== false"
                :id="headingId"
                class="text-2xl font-bold text-gray-900 uppercase tracking-wide border-l-4 border-emerald-600 pl-3"
            >
                {{ title }}
            </h2>

            <!-- Date selector -->
            <label
                class="flex items-center gap-2 text-sm text-gray-600 font-medium"
            >
                <span>Date</span>
                <input
                    v-model="selectedDate"
                    type="date"
                    class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
            </label>
        </div>

        <!-- Skeleton loading -->
        <div
            v-if="isPending"
            aria-busy="true"
            aria-label="Chargement…"
            class="flex flex-col gap-3"
        >
            <div
                v-for="i in 3"
                :key="i"
                class="rounded-2xl border border-gray-100 overflow-hidden"
            >
                <div class="h-11 bg-gray-100 animate-pulse" />
                <div class="divide-y divide-gray-100">
                    <div v-for="j in 3" :key="j" class="flex gap-4 px-5 py-3">
                        <div
                            class="h-4 w-12 bg-gray-100 rounded animate-pulse"
                        />
                        <div
                            class="h-4 flex-1 bg-gray-100 rounded animate-pulse"
                        />
                        <div
                            class="h-4 w-16 bg-gray-100 rounded animate-pulse"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty -->
        <div
            v-else-if="isEmpty"
            class="text-center py-16 text-gray-400 text-sm"
        >
            {{ emptyMessage ?? "Aucun résultat." }}
        </div>

        <!-- Content -->
        <div v-else class="flex flex-col gap-3">
            <slot />
        </div>
    </section>
</template>
