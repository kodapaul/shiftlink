<script setup lang="ts">
/**
 * One row in the Applications tab — the professional's view of a single
 * application they submitted. Shows the shift context (role, date, time,
 * location, rate), a status pill, and a relative "applied X ago".
 *
 * Withdrawing is supported only while the application is pending. Once
 * the facility accepts or declines, the decision is final and the
 * Cancel button hides. The parent component owns the actual cancel
 * call; this row just emits.
 */

import { computed, ref } from 'vue'
import {
  CalendarDays,
  Clock,
  DollarSign,
  MapPin,
  X,
} from 'lucide-vue-next'
import ApplicationStatusBadge from '@/modules/applications/components/ApplicationStatusBadge.vue'
import RichTextRenderer from '@/components/RichTextRenderer.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  formatRate,
  formatShiftDate,
  formatShiftTimes,
  formatTimeAgo,
} from '@/helpers/format'
import { ApplicationStatus } from '@/modules/applications/enums'
import type { ShiftApplication } from '@/modules/applications/types'
import type { Shift } from '@/modules/shifts/types'

const props = defineProps<{
  application: ShiftApplication
  shift: Shift
}>()

const emit = defineEmits<{
  (e: 'cancel', applicationId: string): void
}>()

const dateLabel = computed(() => formatShiftDate(props.shift.date))
const timeLabel = computed(() =>
  formatShiftTimes(props.shift.startTime, props.shift.endTime),
)
const rateLabel = computed(() => formatRate(props.shift.hourlyRate))
const appliedAgo = computed(() => formatTimeAgo(props.application.appliedAt))

const isPending = computed(
  () => props.application.status === ApplicationStatus.Pending,
)

// Confirm dialog state — guards against an accidental tap on the Cancel
// button. Opens on click, closes on either action.
const confirmOpen = ref<boolean>(false)

function confirmCancel() {
  emit('cancel', props.application.id)
  confirmOpen.value = false
}
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

    <!-- Cancel — only available while the application is pending.
         Once accepted or declined, the decision is final. -->
    <div
      v-if="isPending"
      class="mt-5 flex justify-end border-t border-mist pt-4"
    >
      <Button
        type="button"
        variant="outline"
        class="h-9 rounded-full border-ink/20 px-4 text-[13px] text-ink/70 hover:bg-ink/5 hover:text-ink"
        @click="confirmOpen = true"
      >
        <X class="mr-1.5 h-3.5 w-3.5" />
        Cancel application
      </Button>
    </div>

    <Dialog v-model:open="confirmOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="font-serif text-2xl font-semibold tracking-tight">
            Cancel this application?
          </DialogTitle>
          <DialogDescription class="text-[14px] leading-relaxed text-ink/70">
            You'll be removed from the applicant list for
            <span class="font-medium text-ink">{{ shift.role }}</span>
            on
            <span class="font-medium text-ink">{{ dateLabel }}</span>.
            You can re-apply later if it's still open.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            class="h-10 rounded-full border-ink/20 px-4 text-[13px] hover:bg-ink/5"
            @click="confirmOpen = false"
          >
            Keep application
          </Button>
          <Button
            type="button"
            class="h-10 rounded-full bg-ink px-4 text-[13px] font-medium text-cream hover:bg-ink/90"
            @click="confirmCancel"
          >
            Yes, cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </article>
</template>
