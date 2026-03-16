<script setup lang="ts">
import TournamentListComponent from "@/components/tournament/TournamentListComponent.vue";
</script>

<template>
    <div class="max-w-6xl w-full mx-auto">
        <TournamentListComponent
            title="Les tournois"
            paginated
            class="w-full"
        />
    </div>
</template>
