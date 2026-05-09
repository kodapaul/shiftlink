<script setup lang="ts">
/**
 * One row in the Applications tab — the professional's view of a single
 * application they submitted. Shows the shift context (role, date, time,
 * location, rate), a status pill, and a relative "applied X ago".
 *
 * Pure presentational. The parent owns the joined-row data shape; this
 * component just renders.
 *
 * Withdrawing an application is intentionally not modelled in this
 * prototype (see docu/WORKFLOW.md "Out of scope") — there's no destructive
 * action on this row.
 */

import { computed } from 'vue'
import {
  CalendarDays,
  Clock,
  DollarSign,
  MapPin,
} from 'lucide-vue-next'
import ApplicationStatusBadge from '@/modules/applications/components/ApplicationStatusBadge.vue'
import RichTextRenderer from '@/components/RichTextRenderer.vue'
import {
  formatRate,
  formatShiftDate,
  formatShiftTimes,
  formatTimeAgo,
} from '@/helpers/format'
import type { ShiftApplication } from '@/modules/applications/types'
import type { Shift } from '@/modules/shifts/types'

const props = defineProps<{
  application: ShiftApplication
  shift: Shift
}>()

const dateLabel = computed(() => formatShiftDate(props.shift.date))
const timeLabel = computed(() =>
  formatShiftTimes(props.shift.startTime, props.shift.endTime),
)
const rateLabel = computed(() => formatRate(props.shift.hourlyRate))
const appliedAgo = computed(() => formatTimeAgo(props.application.appliedAt))
</script>

<template>
  <article class="rounded-2xl border border-mist bg-bone p-6">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1.5">
        <h3 class="font-serif text-xl font-semibold tracking-tight text-ink">
          {{ shift.role }}
        </h3>
        <p class="text-[12px] text-ink/55">
          Applied {{ appliedAgo }}
        </p>
      </div>
      <ApplicationStatusBadge :status="application.status" />
    </header>

    <dl
      class="mt-5 grid gap-x-6 gap-y-3 text-[13px] text-ink/75 sm:grid-cols-2 lg:grid-cols-4"
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

    <div
      v-if="application.message"
      class="mt-5 border-t border-mist pt-4"
    >
      <p class="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-ink/45">
        Your message
      </p>
      <p class="text-[13px] leading-relaxed text-ink/75">
        {{ application.message }}
      </p>
    </div>

    <div
      v-if="shift.notes"
      class="mt-4 border-t border-mist pt-4"
    >
      <p class="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-ink/45">
        Shift notes
      </p>
      <RichTextRenderer :html="shift.notes" />
    </div>
  </article>
</template>
