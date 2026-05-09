<script setup lang="ts">
/**
 * One shift in the browse list at `/shifts`.
 *
 * Renders the shift's role + key facts (date, time, rate, location,
 * urgency), a small notes preview when present, and either:
 *   - an "Apply" button (default), or
 *   - an "Applied" status pill if the active pro has already applied.
 *
 * Pure presentational. Click anywhere → emits `select` so the parent can
 * highlight the shift on the map and open the apply dialog. The Apply
 * button stops propagation so clicking it doesn't double-fire.
 *
 * The `selected` prop drives the focused-row treatment (ink border,
 * marigold accent). Used when the row's shift is the one currently open
 * in the dialog or pinned on the map.
 */

import { computed } from 'vue'
import {
  Building2,
  CalendarDays,
  Clock,
  DollarSign,
  Flame,
  MapPin,
} from 'lucide-vue-next'
import {
  formatRate,
  formatRelativeDate,
  formatShiftDate,
  formatShiftTimes,
} from '@/helpers/format'
import { Urgency } from '@/modules/shifts/enums'
import type { Shift } from '@/modules/shifts/types'
import type { ShiftApplication } from '@/modules/applications/types'
import ApplicationStatusBadge from '@/modules/applications/components/ApplicationStatusBadge.vue'

const props = defineProps<{
  shift: Shift
  /** Facility name to print on each card. Single-facility prototype, so the
   *  parent passes this once for every row. */
  facilityName?: string | null
  /** Strongest existing application by the active pro for this shift, if any. */
  application?: ShiftApplication | null
  /** Highlighted treatment when this row is the focus of the parent. */
  selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', shiftId: string): void
  (e: 'apply', shiftId: string): void
}>()

const dateLabel = computed(() => formatShiftDate(props.shift.date))
const relativeLabel = computed(() => formatRelativeDate(props.shift.date))
const timeLabel = computed(() =>
  formatShiftTimes(props.shift.startTime, props.shift.endTime),
)
const rateLabel = computed(() => formatRate(props.shift.hourlyRate))
const isUrgent = computed(() => props.shift.urgency === Urgency.Urgent)
const hasApplied = computed(() => !!props.application)

function onCardClick(): void {
  emit('select', props.shift.id)
}

function onApplyClick(): void {
  emit('apply', props.shift.id)
}
</script>

<template>
  <article
    :class="[
      'cursor-pointer rounded-2xl border bg-bone p-5 transition-colors sm:p-6',
      selected
        ? 'border-ink ring-1 ring-inset ring-ink/15'
        : 'border-mist hover:border-ink/30',
    ]"
    role="button"
    :aria-pressed="selected"
    @click="onCardClick"
  >
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="font-serif text-xl font-semibold tracking-tight text-ink">
            {{ shift.role }}
          </h3>
          <span
            v-if="isUrgent"
            class="inline-flex items-center gap-1.5 rounded-full border border-blush/60 bg-blush/30 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ink"
          >
            <Flame class="h-3 w-3" />
            Urgent
          </span>
        </div>
        <p
          v-if="facilityName"
          class="flex items-center gap-1.5 text-[13px] font-medium text-ink/75"
        >
          <Building2 class="h-3.5 w-3.5 text-ink/45" />
          <span class="truncate">{{ facilityName }}</span>
        </p>
        <p class="text-[12px] text-ink/55">{{ relativeLabel }}</p>
      </div>

      <!-- Right-side action: Applied pill OR Apply button -->
      <ApplicationStatusBadge
        v-if="hasApplied && application"
        :status="application.status"
      />
      <button
        v-else
        type="button"
        class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-marigold px-4 text-[12px] font-medium text-ink transition-colors hover:bg-marigold/90"
        @click.stop="onApplyClick"
      >
        Apply
      </button>
    </header>

    <dl
      class="mt-4 grid gap-x-6 gap-y-2 text-[13px] text-ink/75 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div class="flex items-center gap-2">
        <CalendarDays class="h-3.5 w-3.5 text-ink/45" />
        <span>{{ dateLabel }}</span>
      </div>
      <div class="flex items-center gap-2">
        <Clock class="h-3.5 w-3.5 text-ink/45" />
        <span>{{ timeLabel }}</span>
      </div>
      <div class="flex items-center gap-2">
        <DollarSign class="h-3.5 w-3.5 text-ink/45" />
        <span>{{ rateLabel }}</span>
      </div>
      <div v-if="shift.location" class="flex items-center gap-2">
        <MapPin class="h-3.5 w-3.5 text-ink/45" />
        <span class="truncate">{{ shift.location }}</span>
      </div>
    </dl>
  </article>
</template>
