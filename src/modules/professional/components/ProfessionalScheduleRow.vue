<script setup lang="ts">
/**
 * One row in the Schedule tab — a confirmed, claimed shift on the
 * professional's calendar. Renders the date as a stacked callout (large
 * day number on top, weekday + month under) so the row reads like a diary
 * entry rather than a list item.
 *
 * Pure presentational. The `tone` prop lets the parent dim past entries.
 */

import { computed } from 'vue'
import { Clock, DollarSign, MapPin } from 'lucide-vue-next'
import RichTextRenderer from '@/components/RichTextRenderer.vue'
import { formatRate, formatShiftTimes } from '@/helpers/format'
import type { Shift } from '@/modules/shifts/types'

const props = withDefaults(
  defineProps<{
    shift: Shift
    tone?: 'upcoming' | 'past'
  }>(),
  { tone: 'upcoming' },
)

const date = computed(() => new Date(props.shift.date + 'T00:00:00'))

const dayNumber = computed(() => String(date.value.getDate()))
const weekday = computed(() =>
  date.value.toLocaleDateString('en-AU', { weekday: 'short' }),
)
const monthShort = computed(() =>
  date.value.toLocaleDateString('en-AU', { month: 'short' }),
)
const yearLabel = computed(() => {
  const sameYear = date.value.getFullYear() === new Date().getFullYear()
  return sameYear ? null : String(date.value.getFullYear())
})

const timeLabel = computed(() =>
  formatShiftTimes(props.shift.startTime, props.shift.endTime),
)
const rateLabel = computed(() => formatRate(props.shift.hourlyRate))

const isPast = computed(() => props.tone === 'past')
</script>

<template>
  <article
    :class="[
      'flex gap-5 rounded-2xl border p-5 sm:gap-6 sm:p-6',
      isPast
        ? 'border-mist bg-bone/60 opacity-80'
        : 'border-mist bg-bone',
    ]"
  >
    <!-- Date callout -->
    <div
      :class="[
        'flex shrink-0 flex-col items-center justify-center rounded-xl px-4 py-3 text-center sm:px-5',
        isPast ? 'bg-mist/45 text-ink/65' : 'bg-marigold/30 text-ink',
      ]"
    >
      <span class="text-[10px] uppercase tracking-[0.18em]">
        {{ weekday }}
      </span>
      <span class="font-serif text-3xl font-semibold leading-none tabular-nums">
        {{ dayNumber }}
      </span>
      <span class="mt-1 text-[11px] uppercase tracking-[0.16em]">
        {{ monthShort }}<span v-if="yearLabel"> {{ yearLabel }}</span>
      </span>
    </div>

    <!-- Body -->
    <div class="min-w-0 flex-1 space-y-2">
      <h3 class="font-serif text-lg font-semibold tracking-tight text-ink">
        {{ shift.role }}
      </h3>

      <dl class="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-ink/70">
        <div class="flex items-center gap-1.5">
          <Clock class="h-3.5 w-3.5 text-ink/45" />
          <span>{{ timeLabel }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <DollarSign class="h-3.5 w-3.5 text-ink/45" />
          <span>{{ rateLabel }}</span>
        </div>
        <div v-if="shift.location" class="flex items-center gap-1.5">
          <MapPin class="h-3.5 w-3.5 text-ink/45" />
          <span class="truncate">{{ shift.location }}</span>
        </div>
      </dl>

      <RichTextRenderer
        v-if="shift.notes && !isPast"
        :html="shift.notes"
        class="text-[13px] !leading-snug"
      />
    </div>
  </article>
</template>
