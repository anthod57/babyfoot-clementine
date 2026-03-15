<script setup lang="ts">
import HeroSection from "@/components/home/HeroSection.vue";
import NewsComponent from "@/components/NewsComponent.vue";
import { onMounted, ref } from "vue";
import type { MatchWithTeams } from "@/types/api";
import { matchesApi } from "@/api/matches";
import MatchListComponent from "@/components/match/MatchListComponent.vue";

const matches = ref<MatchWithTeams[]>([]);

onMounted(async () => {
    matches.value = await matchesApi.getAll();
});
</script>

<template>
    <HeroSection />
    <NewsComponent />
    <MatchListComponent
        :groups="matches"
        :max-display="20"
        title="Les prochains matchs"
        class="max-w-[95vw] lg:max-w-6xl"
    />
</template>
