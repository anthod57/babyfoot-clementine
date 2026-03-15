<script setup lang="ts">
import HeroSection from "@/components/home/HeroSection.vue";
import NewsComponent from "@/components/NewsComponent.vue";
import MatchListComponent from "@/components/match/MatchListComponent.vue";
import TournamentListComponent from "@/components/tournament/TournamentListComponent.vue";
</script>

<template>
    <HeroSection />
    <NewsComponent />
    <MatchListComponent
        :upcoming="true"
        title="Les prochains matchs"
        :max-display="20"
        class="max-w-6xl mx-auto"
    />
    <TournamentListComponent
        title="Les tournois"
        :max-display="10"
        class="max-w-6xl mx-auto"
    />
</template>
