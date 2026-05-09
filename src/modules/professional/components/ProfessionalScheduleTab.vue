<script setup lang="ts">
/**
 * Schedule tab on `/professional`.
 *
 * Two view modes the user toggles between:
 *   - List   — original Upcoming + Past stacked list (default)
 *   - Calendar — month grid via `CalendarMonth`, with a detail panel below
 *                showing whatever day is selected
 *
 * Both views read from the same `useProfessionalSchedule()` composable;
 * only the rendering differs.
 */

import { computed, ref } from 'vue'
import { CalendarClock, CalendarDays, List } from 'lucide-vue-next'
import CalendarMonth, { type CalendarEntry } from '@/components/CalendarMonth.vue'
import { useProfessionalSchedule } from '../composables/useProfessionalSchedule'
import ProfessionalScheduleRow from './ProfessionalScheduleRow.vue'

const { allRows, upcoming, past, counts, nextShift } = useProfessionalSchedule()

type ViewMode = 'list' | 'calendar'
const viewMode = ref<ViewMode>('list')

// --- Calendar state. Default the visible month to the next-shift's month
// when there is one, otherwise today. Pre-select the next shift's date so
// the detail panel below the grid shows something useful out of the gate.
function todayISOLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function monthOf(iso: string): string {
  return iso.slice(0, 7)
}

const initialDate = nextShift.value?.shift.date ?? todayISOLocal()
const calendarMonth = ref<string>(monthOf(initialDate))
const selectedDate = ref<string | undefined>(initialDate)

const calendarEntries = computed<CalendarEntry[]>(() => {
  const today = todayISOLocal()
  return allRows.value.map((r) => ({
    id: r.application.id,
    date: r.shift.date,
    tone: r.shift.date >= today ? 'upcoming' : 'past',
  }))
})

/** Schedule rows on the currently-selected calendar date. Multiple shifts
 *  on a single day are rare in practice but supported. */
const selectedRows = computed(() => {
  if (!selectedDate.value) return []
  return allRows.value.filter((r) => r.shift.date === selectedDate.value)
})

const selectedDateLabel = computed<string>(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value + 'T00:00:00')
  return d.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
})

const selectedIsPast = computed<boolean>(
  () => !!selectedDate.value && selectedDate.value < todayISOLocal(),
)
</script>

<template>
  <div class="space-y-10">
    <!-- View toggle: List | Calendar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-[12px] text-ink/55">
        <span class="text-ink/85 tabular-nums">{{ counts.total }}</span>
        {{ counts.total === 1 ? 'claimed shift' : 'claimed shifts' }}
        <span v-if="counts.upcoming > 0" class="text-ink/45">
          · {{ counts.upcoming }} upcoming
        </span>
      </p>
      <div
        role="tablist"
        aria-label="Schedule view"
        class="inline-flex items-center gap-1 rounded-full bg-mist/60 p-1"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="viewMode === 'list'"
          :class="[
            'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors',
            viewMode === 'list'
              ? 'bg-ink text-cream'
              : 'bg-transparent text-ink/65 hover:bg-ink/5 hover:text-ink',
          ]"
          @click="viewMode = 'list'"
        >
          <List class="h-3 w-3" />
          List
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="viewMode === 'calendar'"
          :class="[
            'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors',
            viewMode === 'calendar'
              ? 'bg-ink text-cream'
              : 'bg-transparent text-ink/65 hover:bg-ink/5 hover:text-ink',
          ]"
          @click="viewMode = 'calendar'"
        >
          <CalendarDays class="h-3 w-3" />
          Calendar
        </button>
      </div>
    </div>

    <!-- Empty state — covers both view modes -->
    <div
      v-if="counts.total === 0"
      class="rounded-3xl border border-dashed border-mist bg-bone/60 px-6 py-16 text-center"
    >
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mist/70">
        <CalendarClock class="h-5 w-5 text-ink/55" />
      </div>
      <h2 class="mt-5 font-serif text-xl font-semibold tracking-tight text-ink">
        No claimed shifts yet.
      </h2>
      <p class="mx-auto mt-2 max-w-md text-sm text-ink/55">
        Once a facility accepts one of your applications, the shift lands
        here as a confirmed booking.
      </p>
    </div>

    <!-- LIST VIEW -->
    <template v-else-if="viewMode === 'list'">
      <!-- Hero "next shift" call-out, if any -->
      <section v-if="nextShift" class="space-y-3">
        <p class="text-[11px] uppercase tracking-[0.22em] text-ink/55">
          Your next shift
        </p>
        <ProfessionalScheduleRow :shift="nextShift.shift" tone="upcoming" />
      </section>

      <!-- Upcoming list -->
      <section v-if="upcoming.length > 0" class="space-y-4">
        <header class="flex items-baseline justify-between gap-3">
          <h3 class="font-serif text-xl font-semibold tracking-tight text-ink">
            Upcoming
          </h3>
          <span class="text-[12px] text-ink/55 tabular-nums">
            {{ counts.upcoming }} {{ counts.upcoming === 1 ? 'shift' : 'shifts' }}
          </span>
        </header>
        <ul class="space-y-3">
          <li v-for="row in upcoming" :key="row.application.id">
            <ProfessionalScheduleRow :shift="row.shift" tone="upcoming" />
          </li>
        </ul>
      </section>

      <!-- Past list -->
      <section v-if="past.length > 0" class="space-y-4">
        <header class="flex items-baseline justify-between gap-3">
          <h3 class="font-serif text-xl font-semibold tracking-tight text-ink">
            Past
          </h3>
          <span class="text-[12px] text-ink/55 tabular-nums">
            {{ counts.past }} {{ counts.past === 1 ? 'shift' : 'shifts' }}
          </span>
        </header>
        <ul class="space-y-3">
          <li v-for="row in past" :key="row.application.id">
            <ProfessionalScheduleRow :shift="row.shift" tone="past" />
          </li>
        </ul>
      </section>
    </template>

    <!-- CALENDAR VIEW -->
    <template v-else>
      <div class="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <CalendarMonth
          v-model:month="calendarMonth"
          v-model:selected-date="selectedDate"
          :entries="calendarEntries"
        />

        <!-- Detail panel for the selected date -->
        <aside class="rounded-2xl border border-mist bg-bone p-5 sm:p-6">
          <header class="mb-4 space-y-1">
            <p class="text-[11px] uppercase tracking-[0.22em] text-ink/55">
              {{ selectedIsPast ? 'Past day' : 'Selected day' }}
            </p>
            <h3 class="font-serif text-xl font-semibold tracking-tight text-ink">
              {{ selectedDateLabel }}
            </h3>
          </header>

          <div v-if="selectedRows.length > 0" class="space-y-3">
            <ProfessionalScheduleRow
              v-for="row in selectedRows"
              :key="row.application.id"
              :shift="row.shift"
              :tone="selectedIsPast ? 'past' : 'upcoming'"
            />
          </div>
          <p v-else class="text-[14px] italic text-ink/45">
            No shifts on this day. Pick a different date — marigold dots are
            upcoming, sage dots are past.
          </p>
        </aside>
      </div>
    </template>
  </div>
</template>
