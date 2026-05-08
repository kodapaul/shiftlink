<script setup lang="ts">
import { computed } from 'vue'
import type { Shift } from '@/modules/shifts/types'
import { SHIFT_TYPE_LABELS, ShiftStatus } from '@/modules/shifts/enums'
import {
  formatShiftDate,
  formatShiftTimes,
  formatRate,
  formatRelativeDate,
  formatTimeAgo,
} from '@/helpers/format'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import ShiftStatusBadge from './ShiftStatusBadge.vue'
import ApplicationCountBadge from '@/modules/applications/components/ApplicationCountBadge.vue'
import ClaimedByBadge from '@/modules/applications/components/ClaimedByBadge.vue'
import RichTextRenderer from '@/components/RichTextRenderer.vue'
import { useShiftApplications } from '@/modules/applications/composables/useShiftApplications'
import { MapPin, Pencil, Trash2 } from 'lucide-vue-next'

const props = defineProps<{ shift: Shift }>()
defineEmits<{ (e: 'delete', id: string): void }>()

const router = useRouter()

// Claimed shifts can't be edited; once a professional has the slot we don't
// want the terms to move under them.
const canEdit = computed(() => props.shift.status === ShiftStatus.Open)

function goToEdit() {
  router.push(`/facility/shifts/${props.shift.id}/edit`)
}

// The card body is one big clickable region. Buttons inside use @click.stop
// so they don't trigger the card-level navigation.
function goToDetail() {
  router.push(`/facility/shifts/${props.shift.id}`)
}

// Reactive count of pending applications for this shift.
const { pendingCount, applications } = useShiftApplications(() => props.shift.id)

// For claimed shifts we show "Claimed by [name]" instead of an applicant count.
const isClaimed = computed(() => props.shift.status === ShiftStatus.Claimed)

const date = computed(() => formatShiftDate(props.shift.date))
const relative = computed(() => formatRelativeDate(props.shift.date))
const times = computed(() => formatShiftTimes(props.shift.startTime, props.shift.endTime))
const rate = computed(() => formatRate(props.shift.hourlyRate))
const roleLabel = computed(() => props.shift.role)
const shiftLabel = computed(() => SHIFT_TYPE_LABELS[props.shift.shiftType])
const posted = computed(() => formatTimeAgo(props.shift.createdAt))
</script>

<template>
  <article
    class="group relative grid cursor-pointer gap-6 rounded-3xl border border-mist/80 bg-bone p-6 transition-colors hover:border-mist hover:bg-bone/85 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-7"
    role="link"
    :aria-label="`View shift ${roleLabel}`"
    @click="goToDetail"
  >
    <!-- Left: identity + meta -->
    <div class="space-y-3 min-w-0">
      <div class="flex flex-wrap items-center gap-2">
        <ShiftStatusBadge :shift="shift" />
        <span class="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/55">
          {{ shiftLabel }}
        </span>
        <ClaimedByBadge
          v-if="isClaimed && shift.claimedByProfessionalId"
          :professional-id="shift.claimedByProfessionalId"
        />
        <ApplicationCountBadge
          v-else
          :count="pendingCount"
          :total="applications.length"
        />
      </div>

      <h3
        class="font-serif text-2xl font-semibold leading-tight tracking-tight text-ink md:text-[28px]"
      >
        {{ roleLabel }}
      </h3>

      <div class="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm text-ink/75">
        <span class="font-medium text-ink">{{ date }}</span>
        <span class="text-ink/50">{{ relative }}</span>
        <span class="text-ink/30">·</span>
        <span>{{ times }}</span>
        <span class="text-ink/30">·</span>
        <span class="font-medium text-ink">{{ rate }}</span>
      </div>

      <p v-if="shift.location" class="inline-flex items-center gap-1.5 text-sm text-ink/70">
        <MapPin class="h-3.5 w-3.5 text-ink/50" />
        {{ shift.location }}
      </p>

      <RichTextRenderer
        v-if="shift.notes"
        :html="shift.notes"
        class="max-w-prose text-sm text-ink/70"
      />
    </div>

    <!-- Right: action + footer -->
    <div
      class="flex flex-row items-center justify-between gap-3 md:flex-col md:items-end md:justify-center"
    >
      <span class="text-[11px] uppercase tracking-[0.14em] text-ink/45">
        Posted {{ posted }}
      </span>
      <div class="flex items-center gap-1">
        <Button
          v-if="canEdit"
          variant="ghost"
          size="sm"
          class="text-ink/60 hover:bg-mist/55 hover:text-ink"
          @click.stop="goToEdit"
        >
          <Pencil class="h-4 w-4" />
          <span>Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="text-ink/60 hover:bg-blush/30 hover:text-ink"
          @click.stop="$emit('delete', shift.id)"
        >
          <Trash2 class="h-4 w-4" />
          <span>Delete</span>
        </Button>
      </div>
    </div>
  </article>
</template>
