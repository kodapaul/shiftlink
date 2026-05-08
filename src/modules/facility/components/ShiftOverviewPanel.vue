<script setup lang="ts">
import { computed } from 'vue'
import type { Shift } from '@/modules/shifts/types'
import { SHIFT_TYPE_LABELS } from '@/modules/shifts/enums'
import {
  formatRate,
  formatRelativeDate,
  formatShiftDate,
  formatShiftTimes,
} from '@/helpers/format'
import { CalendarDays, Clock, DollarSign, MapPin, NotebookPen } from 'lucide-vue-next'

// Read-only details for a shift. Used inside the Overview tab on the
// shift detail page. Each row is a label + value pair so it's easy to scan.
const props = defineProps<{ shift: Shift }>()

const date = computed(() => formatShiftDate(props.shift.date))
const relative = computed(() => formatRelativeDate(props.shift.date))
const times = computed(() => formatShiftTimes(props.shift.startTime, props.shift.endTime))
const rate = computed(() => formatRate(props.shift.hourlyRate))
const shiftLabel = computed(() => SHIFT_TYPE_LABELS[props.shift.shiftType])
</script>

<template>
  <div class="grid gap-4 rounded-2xl border border-mist bg-bone p-6 md:grid-cols-2">
    <div class="space-y-1">
      <p class="text-[10px] uppercase tracking-[0.18em] text-ink/45">When</p>
      <p class="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
        <CalendarDays class="h-4 w-4 text-ink/55" />
        {{ date }}
      </p>
      <p class="text-[12px] text-ink/55">{{ relative }} · {{ shiftLabel }}</p>
    </div>

    <div class="space-y-1">
      <p class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Hours</p>
      <p class="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
        <Clock class="h-4 w-4 text-ink/55" />
        {{ times }}
      </p>
    </div>

    <div class="space-y-1">
      <p class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Pay</p>
      <p class="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
        <DollarSign class="h-4 w-4 text-ink/55" />
        {{ rate }}
      </p>
    </div>

    <div v-if="shift.location" class="space-y-1">
      <p class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Location</p>
      <p class="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
        <MapPin class="h-4 w-4 text-ink/55" />
        {{ shift.location }}
      </p>
    </div>

    <div v-if="shift.notes" class="md:col-span-2 space-y-1">
      <p class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Notes</p>
      <p class="flex items-start gap-2 text-[14px] leading-relaxed text-ink/80">
        <NotebookPen class="mt-0.5 h-4 w-4 shrink-0 text-ink/55" />
        {{ shift.notes }}
      </p>
    </div>
  </div>
</template>
