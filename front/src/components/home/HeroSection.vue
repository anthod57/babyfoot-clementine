<script setup lang="ts">
import ButtonComponent from "@/components/common/ButtonComponent.vue";
</script>

<template>
    <section
        aria-label="Présentation du championnat"
        class="relative h-[500px] lg:h-auto lg:aspect-16/7 lg:min-h-[500px] w-full overflow-hidden"
    >
        <img
            src="/images/hero_bg.jpg"
            alt=""
            role="presentation"
            fetchpriority="high"
            loading="eager"
            decoding="async"
            class="absolute inset-0 w-full h-full object-cover"
        />

        <div
            class="py-8 lg:px-32 px-8 flex flex-col justify-center lg:items-start items-center h-full gap-4 bg-emerald-600/20 relative backdrop-blur-sm"
        >
            <h1
                class="text-4xl font-bold text-white drop-shadow-lg max-w-3xl lg:text-left text-center"
            >
                Préparez-vous pour la saison 2026-2027 du
                <span class="shimmer-text">CLEMENTINE</span> Babyfoot
                Championship&nbsp;!
            </h1>
            <p
                class="text-lg text-white drop-shadow-lg max-w-3xl lg:text-left text-center"
            >
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
            </p>
            <ButtonComponent variant="primary" size="lg"
                >En savoir plus</ButtonComponent
            >
        </div>
    </section>
</template>

<style scoped>
.shimmer-text {
    background: linear-gradient(90deg, #ff7e3c 50%, white 50%);
    background-size: 200% auto;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    animation: sweep 3s linear infinite;
}

@keyframes sweep {
    from {
        background-position: 100% center;
    }
    to {
        background-position: -100% center;
    }
}
</style>
