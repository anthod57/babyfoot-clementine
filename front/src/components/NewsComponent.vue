<script setup lang="ts">
import ButtonComponent from "@/components/common/ButtonComponent.vue";
import { formatDate, toISOString } from "@/utils/date";

const NewsCategory = {
    Tournaments: "Tournaments",
    Matches: "Matches",
    Results: "Results",
    Players: "Players",
    Teams: "Teams",
    Clubs: "Clubs",
    Leagues: "Leagues",
    Championships: "Championships",
    Cups: "Cups",
    Events: "Events",
} as const;

type NewsCategory = (typeof NewsCategory)[keyof typeof NewsCategory];

interface NewsItem {
    id: number;
    date: Date;
    title: string;
    description: string;
    category: NewsCategory;
    href: string;
}

const news: NewsItem[] = [
    {
        id: 1,
        date: new Date("2026-03-09"),
        title: "CDF des Clubs 2026 : Compositions des Ligues",
        description:
            "Le classement des clubs arrêté au 09/03/2026 a permis de fixer la composition des ligues pour le Championnat de France des Clubs.",
        category: NewsCategory.Tournaments,
        href: "/news/cdf-clubs-2026-compositions",
    },
    {
        id: 2,
        date: new Date("2026-02-18"),
        title: "CDF des Clubs 2026 : dossier disponible",
        description:
            "Le dossier officiel des Championnats de France des Clubs 2026 est désormais accessible.",
        category: NewsCategory.Clubs,
        href: "/news/cdf-clubs-2026-dossier",
    },
    {
        id: 3,
        date: new Date("2026-02-18"),
        title: "Nos Têtes de Série de l'Open National de Hoenheim 2026",
        description:
            "Nous sommes heureux de vous annoncer les têtes de série pour les compétitions Open Simple et Open Double de l'Open National de Hoenheim classé ITSF 500 !",
        category: NewsCategory.Matches,
        href: "/news/tetes-serie-hoenheim-2026",
    },
];

const categoryColor: Record<NewsCategory, string> = {
    [NewsCategory.Tournaments]: "bg-emerald-600",
    [NewsCategory.Matches]: "bg-gray-700",
    [NewsCategory.Results]: "bg-amber-500",
    [NewsCategory.Players]: "bg-blue-500",
    [NewsCategory.Teams]: "bg-purple-500",
    [NewsCategory.Clubs]: "bg-pink-500",
    [NewsCategory.Leagues]: "bg-orange-500",
    [NewsCategory.Championships]: "bg-green-500",
    [NewsCategory.Cups]: "bg-yellow-500",
    [NewsCategory.Events]: "bg-red-500",
};
</script>

<template>
    <section
        aria-labelledby="news-heading"
        class="max-w-6xl mx-auto px-4 py-10"
    >
        <div class="flex items-center justify-between mb-6">
            <h2
                id="news-heading"
                class="text-2xl font-bold text-gray-900 uppercase tracking-wide border-l-4 border-emerald-600 pl-3"
            >
                Les Actualités
            </h2>
            <ButtonComponent
                variant="outline"
                size="sm"
                aria-label="Voir toutes les actualités"
            >
                Voir plus
            </ButtonComponent>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Main article -->
            <article class="row-span-1 md:row-span-2">
                <RouterLink
                    :to="news[0]!.href"
                    class="group relative rounded-2xl overflow-hidden bg-gray-900 min-h-72 flex flex-col justify-end p-6 h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 block"
                >
                    <div class="relative z-10 flex flex-col gap-2">
                        <span
                            :class="categoryColor[news[0]!.category]"
                            class="self-start text-xs font-semibold text-white px-2.5 py-1 rounded-full uppercase tracking-wide"
                        >
                            {{ news[0]!.category }}
                        </span>
                        <p
                            class="text-xs font-medium text-emerald-400 uppercase tracking-widest"
                        >
                            <time :datetime="toISOString(news[0]!.date)">{{
                                formatDate(news[0]!.date)
                            }}</time>
                        </p>
                        <h3
                            class="text-xl font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors duration-200"
                        >
                            {{ news[0]!.title }}
                        </h3>
                        <p class="text-sm text-gray-300 line-clamp-2">
                            {{ news[0]!.description }}
                        </p>
                    </div>
                </RouterLink>
            </article>

            <!-- Then the other articles -->
            <article v-for="item in news.slice(1)" :key="item.id">
                <RouterLink
                    :to="item.href"
                    class="group relative rounded-2xl overflow-hidden bg-gray-900 min-h-40 flex flex-col justify-end p-5 h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 block"
                >
                    <div class="relative z-10 flex flex-col gap-1.5">
                        <span
                            :class="categoryColor[item.category]"
                            class="self-start text-xs font-semibold text-white px-2 py-0.5 rounded-full uppercase tracking-wide"
                        >
                            {{ item.category }}
                        </span>
                        <p
                            class="text-xs font-medium text-emerald-400 uppercase tracking-widest"
                        >
                            <time :datetime="toISOString(item.date)">{{
                                formatDate(item.date)
                            }}</time>
                        </p>
                        <h3
                            class="text-base font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors duration-200"
                        >
                            {{ item.title }}
                        </h3>
                        <p class="text-xs text-gray-300 line-clamp-2">
                            {{ item.description }}
                        </p>
                    </div>
                </RouterLink>
            </article>
        </div>
    </section>
</template>
