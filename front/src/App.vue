<script setup lang="ts">
import NavbarComponent from "@/components/common/NavbarComponent.vue";
</script>

<template>
    <NavbarComponent />
    <main id="main-content" class="bg-gray-50 flex flex-col mb-8">
        <RouterView class="flex-1" />
    </main>
</template>
