<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import ListSection from '@/components/common/ListSection.vue'
import { useQuery } from '@/composables/useQuery'
import { matchesApi, tournamentsApi } from '@/api'
import { MatchResult } from '@/types/api'
import type { MatchWithTeams } from '@/types/api'
import { formatTime, toISOString } from '@/utils/date'

const props = defineProps<{
  /** If provided, only fetch matches for this tournament */
  tournamentId?: number
  /** Optional section title — hidden if not provided */
  title?: string
  /** Cap the number of displayed matches */
  maxDisplay?: number
}>()

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// Always keep a date selected — default to today, reset to today if cleared
const selectedDate = ref(todayISO())
watch(selectedDate, (val) => { if (!val) selectedDate.value = todayISO() })

const { data: matches, isPending } = useQuery(
  (signal) => {
    const date = selectedDate.value || undefined
    return props.tournamentId
      ? tournamentsApi.getMatches(props.tournamentId, { date, signal })
      : matchesApi.getAll({ date, signal })
  },
  { watch: [selectedDate] },
)

const visibleMatches = computed(() =>
  props.maxDisplay ? matches.value?.slice(0, props.maxDisplay) : matches.value
)

const isEmpty = computed(() => !isPending.value && !matches.value?.length)

function teamClass(match: MatchWithTeams, side: 'home' | 'away'): string {
  if (match.result === MatchResult.Pending) return 'text-gray-700'
  if (match.result === MatchResult.Draw)    return 'text-amber-600'
  const won =
    (side === 'home' && match.result === MatchResult.HomeWin) ||
    (side === 'away' && match.result === MatchResult.AwayWin)
  return won ? 'text-emerald-600' : 'text-gray-400'
}
</script>

<template>
  <ListSection
    v-model:date="selectedDate"
    :title="title ?? 'Matchs'"
    :show-title="!!title"
    heading-id="matches-heading"
    :is-pending="isPending"
    :is-empty="isEmpty"
    empty-message="Aucun match pour cette date."
  >
    <div class="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <ul role="list" class="divide-y divide-gray-100">
        <li
          v-for="match in visibleMatches"
          :key="match.id"
          class="grid items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors duration-150"
          style="grid-template-columns: 3.5rem 1fr auto 1fr"
        >
          <!-- Time -->
          <time
            :datetime="toISOString(match.date)"
            class="text-sm font-mono text-gray-400 tabular-nums"
          >
            {{ formatTime(match.date) }}
          </time>

          <!-- Home team -->
          <span :class="['text-sm font-semibold text-right truncate', teamClass(match, 'home')]">
            {{ match.homeTeam.name }}
          </span>

          <!-- Score or VS -->
          <span class="text-sm font-bold tabular-nums text-center text-gray-400 whitespace-nowrap px-1">
            <template v-if="match.result !== MatchResult.Pending">
              {{ match.homeScore }} – {{ match.awayScore }}
            </template>
            <template v-else>vs</template>
          </span>

          <!-- Away team -->
          <span :class="['text-sm font-semibold truncate', teamClass(match, 'away')]">
            {{ match.awayTeam.name }}
          </span>
        </li>
      </ul>
    </div>
  </ListSection>
</template>
