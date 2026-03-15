<script setup lang="ts">
import NavbarComponent from "@/components/common/NavbarComponent.vue";
</script>

<template>
    <NavbarComponent />
    <main
        id="main-content"
        role="main"
        class="bg-gray-50 flex flex-col pb-8 overflow-x-hidden"
    >
        <RouterView class="flex-1 min-w-0" />
    </main>
</template>
