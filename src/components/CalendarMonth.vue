<script setup lang="ts">
/**
 * CalendarMonth — reusable, brand-styled month calendar.
 *
 * Drops into any view that wants a "show me a month, with a few dates
 * highlighted as having something on them" experience. Currently used by
 * the professional Schedule tab; the facility shift map is a likely future
 * consumer.
 *
 * Visual register: editorial, hairline mist borders, no shadows, generous
 * radius. Shift markers are coloured dots matching brand tones (marigold
 * for upcoming/active, sage for completed/past). Today is ringed in
 * marigold; the selected date is filled ink-on-cream.
 *
 * Public API:
 *   - `month` (YYYY-MM) — which month is showing. Two-way: parent can
 *     update or just let the component manage internally via the prev/next
 *     chevrons by listening to `update:month`.
 *   - `entries` — the dates to mark. Multiple entries can share a date;
 *     the strongest tone wins (upcoming > past).
 *   - `selectedDate` (YYYY-MM-DD) — visually highlighted. Two-way via
 *     `update:selectedDate`.
 *
 * Mon-first week (Australian convention). 6-row grid (42 cells), so cells
 * always fit even months that span 6 weeks; out-of-month cells render
 * dimmed and remain clickable so the user can flow into adjacent months.
 */

import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

export interface CalendarEntry {
  /** YYYY-MM-DD */
  date: string
  /** Caller-provided id, optional. Helpful for keyed @select-entry. */
  id?: string
  /** Drives the dot colour. Defaults to 'upcoming'. */
  tone?: 'upcoming' | 'past'
}

const props = withDefaults(
  defineProps<{
    /** YYYY-MM. Defaults to "now" when undefined. */
    month?: string
    entries?: ReadonlyArray<CalendarEntry>
    /** YYYY-MM-DD. Highlighted as the active selection. */
    selectedDate?: string
  }>(),
  { month: undefined, entries: () => [], selectedDate: undefined },
)

const emit = defineEmits<{
  (e: 'update:month', month: string): void
  (e: 'update:selectedDate', date: string): void
  (e: 'select', date: string): void
}>()

// --- Helpers
function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

function toIsoDate(d: Date): string {
  // Local-time YYYY-MM-DD so a date "today" never flips by UTC rollover.
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function toIsoMonth(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

const todayISO = computed<string>(() => toIsoDate(new Date()))

// Active month, defaulting to the current month if the prop is unset.
const activeMonth = computed<string>(() => props.month ?? toIsoMonth(new Date()))

const monthDate = computed<Date>(() => {
  const [y, m] = activeMonth.value.split('-').map(Number)
  return new Date(y!, (m ?? 1) - 1, 1)
})

const monthLabel = computed<string>(() =>
  monthDate.value.toLocaleDateString('en-AU', {
    month: 'long',
    year: 'numeric',
  }),
)

/** Map of date → strongest tone for that date. Upcoming wins over past. */
const tonesByDate = computed<Map<string, 'upcoming' | 'past'>>(() => {
  const map = new Map<string, 'upcoming' | 'past'>()
  for (const entry of props.entries) {
    const tone = entry.tone ?? 'upcoming'
    const existing = map.get(entry.date)
    if (!existing) {
      map.set(entry.date, tone)
    } else if (existing === 'past' && tone === 'upcoming') {
      map.set(entry.date, 'upcoming')
    }
  }
  return map
})

/** 42 cells (6 rows × 7 cols) starting from the Monday on/before the 1st. */
const cells = computed(() => {
  const first = monthDate.value
  const monthIndex = first.getMonth()

  // Day of week with Monday = 0 (en-AU convention).
  const monIndex = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - monIndex)

  const out: Array<{
    iso: string
    day: number
    isCurrentMonth: boolean
    isToday: boolean
    tone: 'upcoming' | 'past' | null
    isSelected: boolean
  }> = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = toIsoDate(d)
    out.push({
      iso,
      day: d.getDate(),
      isCurrentMonth: d.getMonth() === monthIndex,
      isToday: iso === todayISO.value,
      tone: tonesByDate.value.get(iso) ?? null,
      isSelected: !!props.selectedDate && props.selectedDate === iso,
    })
  }
  return out
})

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

function shiftMonth(delta: number): void {
  const next = new Date(monthDate.value)
  next.setMonth(next.getMonth() + delta)
  emit('update:month', toIsoMonth(next))
}

function jumpToToday(): void {
  emit('update:month', toIsoMonth(new Date()))
  emit('update:selectedDate', todayISO.value)
  emit('select', todayISO.value)
}

function pickDate(iso: string): void {
  emit('update:selectedDate', iso)
  emit('select', iso)
}
</script>

<template>
  <div class="rounded-2xl border border-mist bg-bone p-5 sm:p-6">
    <!-- Header: month label + nav -->
    <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h3 class="font-serif text-xl font-semibold tracking-tight text-ink">
        {{ monthLabel }}
      </h3>
      <div class="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          aria-label="Previous month"
          class="h-9 w-9 rounded-full p-0 text-ink/65 hover:bg-ink/5 hover:text-ink"
          @click="shiftMonth(-1)"
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          class="h-9 rounded-full px-3 text-[12px] font-medium text-ink/65 hover:bg-ink/5 hover:text-ink"
          @click="jumpToToday"
        >
          Today
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-label="Next month"
          class="h-9 w-9 rounded-full p-0 text-ink/65 hover:bg-ink/5 hover:text-ink"
          @click="shiftMonth(1)"
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </header>

    <!-- Weekday header row -->
    <div
      class="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.18em] text-ink/45"
    >
      <div v-for="label in weekdayLabels" :key="label">{{ label }}</div>
    </div>

    <!-- Day grid: 6 rows × 7 cols -->
    <div class="grid grid-cols-7 gap-1">
      <button
        v-for="cell in cells"
        :key="cell.iso"
        type="button"
        :aria-label="cell.iso"
        :aria-pressed="cell.isSelected"
        :class="[
          'relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl text-[13px] tabular-nums transition-colors',
          cell.isSelected
            ? 'bg-ink text-cream'
            : cell.isCurrentMonth
              ? 'text-ink hover:bg-ink/5'
              : 'text-ink/30 hover:bg-ink/5',
          cell.isToday && !cell.isSelected
            ? 'ring-1 ring-inset ring-marigold'
            : '',
        ]"
        @click="pickDate(cell.iso)"
      >
        <span class="leading-none">{{ cell.day }}</span>
        <!-- Tone dot for marked days -->
        <span
          v-if="cell.tone"
          aria-hidden="true"
          :class="[
            'absolute bottom-1.5 h-1.5 w-1.5 rounded-full',
            cell.isSelected
              ? 'bg-cream'
              : cell.tone === 'upcoming'
                ? 'bg-marigold'
                : 'bg-sage',
          ]"
        />
      </button>
    </div>

    <!-- Legend -->
    <footer
      class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-mist pt-3 text-[11px] text-ink/55"
    >
      <span class="inline-flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full bg-marigold" />
        Upcoming
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full bg-sage" />
        Past
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-marigold" />
        Today
      </span>
    </footer>
  </div>
</template>
