<script setup lang="ts">
/**
 * Apply-to-shift modal at `/shifts`.
 *
 * Shows the full shift detail (role, date/time, rate, location, urgency,
 * notes) and an optional message textarea. Submits via the parent through
 * the `submit` emit; the parent's composable runs the gate-and-create
 * logic and closes the dialog on success.
 *
 * Three banner states:
 *   1. Profile incomplete → blush banner + "Complete profile" CTA that
 *      routes to `/professional/edit`. Apply button stays disabled.
 *   2. Already applied   → mist banner showing the existing application
 *      status (Pending / Accepted / Declined). Apply button hidden.
 *   3. Default            → no banner, Apply button enabled.
 */

import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Clock,
  DollarSign,
  Flame,
  LogIn,
  Lock,
  MapPin,
  Send,
} from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import RichTextRenderer from '@/components/RichTextRenderer.vue'
import ApplicationStatusBadge from '@/modules/applications/components/ApplicationStatusBadge.vue'
import {
  formatRate,
  formatShiftDate,
  formatShiftTimes,
} from '@/helpers/format'
import { Urgency } from '@/modules/shifts/enums'
import type { Shift } from '@/modules/shifts/types'
import type { ShiftApplication } from '@/modules/applications/types'
import { ApplicationStatus } from '@/modules/applications/enums'
import type { ProfessionalProfileCompleteness } from '@/modules/professional/types'
import { UserType } from '@/modules/user/enums/UserType'

const props = defineProps<{
  /** Two-way controls dialog open state. */
  open: boolean
  /** The shift currently selected. `null` keeps the dialog closed. */
  shift: Shift | null
  /** Active session's audience. Drives the gate banner:
   *   - null               → "sign in to apply"
   *   - 'facility_staff'   → "apply requires a professional account"
   *   - 'professional'     → existing apply / incomplete / already-applied flow */
  userType: UserType | null
  /** Active pro's strongest existing application against this shift, if any. */
  application?: ShiftApplication | null
  /** Active pro's profile completeness — drives the gate banner. */
  completeness: ProfessionalProfileCompleteness | null
  /** Submitting state from the parent (rare with mock auth, but plumbed). */
  submitting?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
  (e: 'submit', message: string): void
  (e: 'cancel', applicationId: string): void
}>()

// Local message buffer. Resets every time the dialog opens for a new shift
// so leftover text from a previous attempt doesn't reappear.
const message = ref<string>('')

watch(
  () => [props.open, props.shift?.id],
  ([open]) => {
    if (open) message.value = ''
  },
)

// Gate flags. Order matters in the template — most-specific banner wins.
// Unauth + wrong-audience precede pro-specific gates because the latter
// can't apply to anyone who isn't a professional in the first place.
const isUnauthenticated = computed<boolean>(() => props.userType === null)
const isWrongAudience = computed<boolean>(
  () => props.userType !== null && props.userType !== UserType.Professional,
)
const profileIncomplete = computed<boolean>(
  () =>
    props.userType === UserType.Professional &&
    props.completeness !== null &&
    !props.completeness.isComplete,
)

const alreadyApplied = computed<boolean>(() => !!props.application)
/** True only when the session is a pro AND no other gate is blocking. */
const canApply = computed<boolean>(
  () =>
    props.userType === UserType.Professional &&
    !alreadyApplied.value &&
    !profileIncomplete.value,
)

const dateLabel = computed(() =>
  props.shift ? formatShiftDate(props.shift.date) : '',
)
const timeLabel = computed(() =>
  props.shift
    ? formatShiftTimes(props.shift.startTime, props.shift.endTime)
    : '',
)
const rateLabel = computed(() =>
  props.shift ? formatRate(props.shift.hourlyRate) : '',
)
const isUrgent = computed(
  () => props.shift?.urgency === Urgency.Urgent,
)

function handleOpenChange(value: boolean): void {
  emit('update:open', value)
}

function handleSubmit(): void {
  if (!canApply.value) return
  emit('submit', message.value)
}

// True only when the existing application can still be withdrawn —
// i.e. it's currently pending. Once accepted/declined the decision
// is final and the Cancel button hides.
const canCancel = computed<boolean>(
  () =>
    !!props.application &&
    props.application.status === ApplicationStatus.Pending,
)

function handleCancel(): void {
  if (!props.application) return
  emit('cancel', props.application.id)
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent
      v-if="shift"
      class="max-w-2xl gap-0 overflow-hidden rounded-3xl border border-mist bg-bone p-0"
    >
      <DialogHeader class="space-y-2 border-b border-mist px-7 py-6">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="text-[10px] uppercase tracking-[0.22em] text-ink/55"
          >
            Apply for shift
          </span>
          <span
            v-if="isUrgent"
            class="inline-flex items-center gap-1.5 rounded-full border border-blush/60 bg-blush/30 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ink"
          >
            <Flame class="h-3 w-3" />
            Urgent
          </span>
        </div>
        <DialogTitle
          class="font-serif text-2xl font-semibold tracking-tight text-ink"
        >
          {{ shift.role }}
        </DialogTitle>
        <DialogDescription class="text-[13px] text-ink/55">
          Review the details and add an optional message to the facility.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 px-7 py-6">
        <!-- Shift facts grid -->
        <dl
          class="grid gap-x-6 gap-y-3 rounded-2xl bg-cream p-5 text-[14px] text-ink/80 sm:grid-cols-2"
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

        <!-- Notes -->
        <div v-if="shift.notes">
          <p class="mb-2 text-[10px] uppercase tracking-[0.18em] text-ink/45">
            Shift notes
          </p>
          <RichTextRenderer :html="shift.notes" />
        </div>

        <!-- BANNER: not signed in (unauth visitor) -->
        <div
          v-if="isUnauthenticated"
          class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-mist bg-mist/40 px-4 py-3"
        >
          <div class="flex items-start gap-2">
            <LogIn class="mt-0.5 h-4 w-4 shrink-0 text-ink/65" />
            <div class="space-y-1 text-[13px]">
              <p class="font-medium text-ink">
                Sign in to apply for this shift.
              </p>
              <p class="text-ink/65">
                Apply requires a professional account. Sign in if you have
                one, or create one — it's quick.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button
              as-child
              variant="ghost"
              class="h-9 rounded-full px-3 text-[12px] text-ink/65 hover:bg-ink/5 hover:text-ink"
            >
              <RouterLink to="/register">Create account</RouterLink>
            </Button>
            <Button
              as-child
              class="h-9 rounded-full bg-marigold px-4 text-[12px] font-medium text-ink hover:bg-marigold/90"
            >
              <RouterLink to="/login">Sign in</RouterLink>
            </Button>
          </div>
        </div>

        <!-- BANNER: facility staff (signed in but wrong audience) -->
        <div
          v-else-if="isWrongAudience"
          class="flex flex-wrap items-start gap-3 rounded-xl border border-mist bg-mist/40 px-4 py-3"
        >
          <Building2 class="mt-0.5 h-4 w-4 shrink-0 text-ink/65" />
          <div class="space-y-1 text-[13px]">
            <p class="font-medium text-ink">
              Apply isn't available from a facility account.
            </p>
            <p class="text-ink/65">
              You're signed in as facility staff. Applying for shifts is
              for healthcare professionals — sign out and back in with a
              professional account if you'd like to apply.
            </p>
          </div>
        </div>

        <!-- BANNER: profile incomplete -->
        <div
          v-else-if="profileIncomplete"
          class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-blush/50 bg-blush/15 px-4 py-3"
        >
          <div class="flex items-start gap-2">
            <Lock class="mt-0.5 h-4 w-4 shrink-0 text-ink/65" />
            <div class="space-y-1 text-[13px]">
              <p class="font-medium text-ink">
                Complete your profile to apply.
              </p>
              <p class="text-ink/65">
                Facilities need your basics on file before they can review
                an application —
                {{ completeness?.requiredFilled }} /
                {{ completeness?.requiredTotal }} required fields filled.
              </p>
            </div>
          </div>
          <Button
            as-child
            class="h-9 rounded-full bg-marigold px-4 text-[12px] font-medium text-ink hover:bg-marigold/90"
          >
            <RouterLink to="/professional/edit"
              >Complete profile</RouterLink
            >
          </Button>
        </div>

        <!-- BANNER: already applied -->
        <div
          v-else-if="alreadyApplied && application"
          class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-mist bg-mist/40 px-4 py-3"
        >
          <div class="flex items-start gap-2">
            <AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-ink/65" />
            <div class="space-y-1 text-[13px]">
              <p class="font-medium text-ink">
                You've already applied to this shift.
              </p>
              <p class="text-ink/65">
                Track this application in
                <RouterLink
                  to="/professional"
                  class="font-medium text-ink underline-offset-4 hover:underline"
                  >your dashboard</RouterLink
                >.
              </p>
            </div>
          </div>
          <ApplicationStatusBadge :status="application.status" />
        </div>

        <!-- Default: message field — only shown when the gate is clear. -->
        <div v-else-if="canApply" class="space-y-2">
          <Label
            class="text-[11px] uppercase tracking-[0.18em] text-ink/55"
            for="apply-message"
          >
            Message
            <span class="ml-1 normal-case tracking-normal text-ink/40">
              (optional, ~280 chars)
            </span>
          </Label>
          <Textarea
            id="apply-message"
            v-model="message"
            rows="4"
            maxlength="280"
            placeholder="Tell the facility why you're a good fit, or why this shift suits you. Optional."
            class="rounded-xl border-mist bg-cream text-[15px]"
          />
          <p class="text-right text-[12px] tabular-nums text-ink/55">
            {{ message.length }} / 280
          </p>
        </div>
      </div>

      <DialogFooter
        class="flex flex-col-reverse gap-2 border-t border-mist bg-cream/40 px-7 py-5 sm:flex-row sm:justify-end"
      >
        <Button
          type="button"
          variant="ghost"
          class="h-11 rounded-full px-5 text-[13px] text-ink/65 hover:bg-ink/5 hover:text-ink"
          @click="handleOpenChange(false)"
        >
          {{ canApply ? 'Cancel' : 'Close' }}
        </Button>
        <!-- Apply button only renders when the gate is fully clear. The
             non-pro and already-applied banners above already explain the
             reason and offer next-action CTAs (sign in / complete profile /
             go to dashboard). -->
        <Button
          v-if="canApply"
          type="button"
          :disabled="submitting"
          class="h-11 rounded-full bg-marigold px-6 text-[13px] font-medium text-ink hover:bg-marigold/90"
          @click="handleSubmit"
        >
          <Send class="mr-1.5 h-3.5 w-3.5" />
          {{ submitting ? 'Submitting…' : 'Apply for this shift' }}
        </Button>
        <!-- Cancel-application button surfaces only when the existing
             application is still pending. Lets the pro withdraw without
             leaving the shift dialog. -->
        <Button
          v-if="canCancel"
          type="button"
          class="h-11 rounded-full bg-ink px-5 text-[13px] font-medium text-cream hover:bg-ink/90"
          @click="handleCancel"
        >
          Cancel application
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
