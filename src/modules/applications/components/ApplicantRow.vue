<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { ShiftApplication } from '@/modules/applications/types'
import type { Professional } from '@/modules/professional/types'
import type { Shift } from '@/modules/shifts/types'
import { ROLE_LABELS, type Role } from '@/modules/professional/enums'
import { ApplicationStatus } from '@/modules/applications/enums'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Check, X, MessageSquare, Clock, CalendarDays } from 'lucide-vue-next'
import {
  formatRate,
  formatShiftDate,
  formatShiftTimes,
  formatTimeAgo,
} from '@/helpers/format'
import ApplicationStatusBadge from './ApplicationStatusBadge.vue'

// One applicant in a list. Renders the professional, their message (if any),
// status, and accept/decline actions when pending.
//
// Optional `shift` prop: when provided, the row also shows shift context
// (role, date, time, rate). Used in the cross-shift Applications view; left
// unset on per-shift views where the shift context is already on the page.
const props = defineProps<{
  application: ShiftApplication
  professional: Professional | null
  shift?: Shift | null
}>()

defineEmits<{
  (e: 'accept', applicationId: string): void
  (e: 'decline', applicationId: string): void
}>()

const router = useRouter()

function goToShift() {
  if (props.shift) router.push(`/facility/shifts/${props.shift.id}`)
}

// Two-letter initials for the avatar fallback.
const initials = computed(() => {
  const name = props.professional?.name ?? ''
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
})

const roleLabel = computed(() => {
  const role = props.professional?.role
  return role ? ROLE_LABELS[role as Role] : 'Healthcare professional'
})

const isPending = computed(() => props.application.status === ApplicationStatus.Pending)
const appliedAgo = computed(() => formatTimeAgo(props.application.appliedAt))
</script>

<template>
  <article
    class="grid gap-4 rounded-2xl border border-mist bg-bone p-5 transition-colors md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start"
  >
    <!-- Avatar -->
    <Avatar class="h-11 w-11 bg-cream text-ink">
      <AvatarFallback class="bg-cream font-serif text-[14px] font-semibold text-ink">
        {{ initials || '·' }}
      </AvatarFallback>
    </Avatar>

    <!-- Identity + message -->
    <div class="min-w-0 space-y-2">
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 class="font-serif text-[17px] font-semibold leading-tight text-ink">
          {{ professional?.name ?? 'Unknown professional' }}
        </h3>
        <span class="text-[13px] text-ink/65">{{ roleLabel }}</span>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-[12px] text-ink/55">
        <ApplicationStatusBadge :status="application.status" />
        <span class="inline-flex items-center gap-1">
          <Clock class="h-3 w-3" />
          Applied {{ appliedAgo }}
        </span>
        <span
          v-if="professional?.yearsExperience != null"
          class="rounded-full bg-mist/70 px-2 py-0.5 text-[11px] text-ink/65"
        >
          {{ professional.yearsExperience }} yrs experience
        </span>
      </div>

      <p
        v-if="application.message"
        class="flex gap-2 rounded-xl border border-mist/70 bg-cream/60 p-3 text-[13px] leading-relaxed text-ink/80"
      >
        <MessageSquare class="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/45" />
        <span>{{ application.message }}</span>
      </p>

      <!-- Shift context. Only rendered when the parent passes a shift prop. -->
      <button
        v-if="shift"
        type="button"
        class="group/ctx flex w-full cursor-pointer items-center gap-2 rounded-xl border border-mist/70 bg-cream/60 px-3 py-2 text-left text-[12px] text-ink/70 transition-colors hover:border-ink/15 hover:bg-cream"
        @click="goToShift"
      >
        <CalendarDays class="h-3.5 w-3.5 shrink-0 text-ink/55" />
        <span class="truncate">
          <span class="font-medium text-ink">{{ shift.role }}</span>
          <span class="text-ink/40"> · </span>
          <span>{{ formatShiftDate(shift.date) }}</span>
          <span class="text-ink/40"> · </span>
          <span class="tabular-nums">{{ formatShiftTimes(shift.startTime, shift.endTime) }}</span>
          <span class="text-ink/40"> · </span>
          <span class="font-medium text-ink/85">{{ formatRate(shift.hourlyRate) }}</span>
        </span>
        <span class="ml-auto text-[11px] text-ink/45 group-hover/ctx:text-ink/70">
          View →
        </span>
      </button>
    </div>

    <!-- Actions: only when pending -->
    <div
      v-if="isPending"
      class="flex flex-row items-center gap-2 md:flex-col md:items-stretch"
    >
      <Button
        size="sm"
        class="rounded-full bg-ink text-cream hover:bg-ink/90"
        @click="$emit('accept', application.id)"
      >
        <Check class="h-4 w-4" />
        <span>Accept</span>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        class="rounded-full text-ink/70 hover:bg-blush/30 hover:text-ink"
        @click="$emit('decline', application.id)"
      >
        <X class="h-4 w-4" />
        <span>Decline</span>
      </Button>
    </div>

    <!-- Footer text when not pending -->
    <p
      v-else
      class="self-center text-right text-[12px] text-ink/50 md:max-w-[10rem]"
    >
      <template v-if="application.decidedAt">
        Decided {{ formatTimeAgo(application.decidedAt) }}
      </template>
    </p>
  </article>
</template>
