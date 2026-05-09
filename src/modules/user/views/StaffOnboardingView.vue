<script setup lang="ts">
/**
 * Onboarding route view (`/staff/onboarding`).
 *
 * Multi-step flow that runs immediately after registration. The wizard
 * walks through: Welcome → Facility info → Invite staff → Done. Marking
 * complete persists to the auth store; subsequent logins skip this view.
 *
 * Single-facility model: the Facility info step is read-only — every staff
 * is bound to the seeded facility, so there's nothing here for the user to
 * edit. The step exists to confirm what they're joining.
 *
 * If a returning, already-onboarded user lands here, we redirect them to
 * the dashboard (the router guard handles the unauth case).
 */
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FACILITY_TYPE_LABELS } from '@/modules/facility/enums/FacilityType'
import { STAFF_POSITION_LABELS } from '@/modules/facility/enums/StaffPosition'
import OnboardingStepper from '../components/OnboardingStepper.vue'
import { OnboardingStep } from '../enums/OnboardingStep'
import { useOnboarding } from '../composables/useOnboarding'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  Sparkles,
} from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()
const { current, isFirst, steps, next, back, complete } = useOnboarding()

// Step 3 stub — the brief doesn't require real invites. We just collect
// emails into a local list so it feels like a real flow.
const inviteInput = ref('')
const invitedEmails = ref<string[]>([])

function addInvite() {
  const email = inviteInput.value.trim()
  if (!email || invitedEmails.value.includes(email)) return
  invitedEmails.value.push(email)
  inviteInput.value = ''
}

function removeInvite(email: string) {
  invitedEmails.value = invitedEmails.value.filter((e) => e !== email)
}

onBeforeMount(() => {
  // Bounce returning users — they've already done this.
  if (auth.isFacilityStaff && auth.hasCompletedOnboarding) {
    router.replace('/facility')
  }
})

function finish() {
  complete()
  router.push('/facility')
}
</script>

<template>
  <main class="min-h-dvh bg-cream">
    <div class="mx-auto flex min-h-dvh max-w-3xl flex-col justify-between px-6 py-12 sm:px-10">
      <!-- Header -->
      <header class="space-y-8">
        <div class="flex items-center justify-between">
          <span class="font-serif text-xl font-semibold tracking-tight text-ink">
            ShiftLink
          </span>
          <span class="text-[11px] uppercase tracking-[0.22em] text-ink/55">
            Setup
          </span>
        </div>
        <OnboardingStepper :steps="steps" />
      </header>

      <!-- Step body -->
      <section class="my-12 flex-1">
        <!-- Welcome -->
        <div v-if="current === OnboardingStep.Welcome" class="space-y-8">
          <div class="space-y-3">
            <Sparkles class="h-7 w-7 text-marigold" />
            <h1 class="font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-ink">
              Welcome, {{ auth.currentFacilityStaff?.name?.split(' ')[0] ?? 'there' }}.
            </h1>
            <p class="text-[17px] leading-relaxed text-ink/70">
              You're in. ShiftLink helps facilities like
              <span class="font-medium text-ink">{{ auth.currentFacility?.name }}</span>
              cover shifts faster — post a role, get applications, accept the
              right one. Three steps to set up, then you're done.
            </p>
          </div>

          <ul class="space-y-3 text-[15px] text-ink/75">
            <li class="flex gap-3 rounded-xl border border-mist bg-bone p-4">
              <span class="mt-0.5 font-serif text-lg text-marigold">1</span>
              <div>
                <p class="font-medium text-ink">Confirm your facility</p>
                <p class="text-[13px] text-ink/55">
                  We'll show the workspace you've been assigned to.
                </p>
              </div>
            </li>
            <li class="flex gap-3 rounded-xl border border-mist bg-bone p-4">
              <span class="mt-0.5 font-serif text-lg text-marigold">2</span>
              <div>
                <p class="font-medium text-ink">Add coworkers (optional)</p>
                <p class="text-[13px] text-ink/55">
                  Bring nurse managers or roster coordinators in. Skippable.
                </p>
              </div>
            </li>
            <li class="flex gap-3 rounded-xl border border-mist bg-bone p-4">
              <span class="mt-0.5 font-serif text-lg text-marigold">3</span>
              <div>
                <p class="font-medium text-ink">Post your first shift</p>
                <p class="text-[13px] text-ink/55">
                  We'll drop you on the dashboard with a button ready to go.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <!-- Facility info (read-only) -->
        <div v-else-if="current === OnboardingStep.Facility" class="space-y-8">
          <div class="space-y-3">
            <h1 class="font-serif text-4xl font-semibold tracking-tight text-ink">
              You've been assigned to a facility.
            </h1>
            <p class="text-[15px] text-ink/65">
              For this prototype, every account works inside one shared
              facility — multi-facility tenancy isn't part of the brief.
            </p>
          </div>

          <div class="space-y-5 rounded-2xl border border-mist bg-bone p-8">
            <div class="flex items-start gap-3 rounded-xl bg-mist/40 px-4 py-3">
              <Info class="mt-0.5 h-4 w-4 shrink-0 text-ink/55" />
              <p class="text-[13px] leading-relaxed text-ink/70">
                Posts, applications, and shifts you create will live alongside
                the rest of this facility's roster.
              </p>
            </div>

            <dl
              v-if="auth.currentFacility"
              class="grid gap-5 border-t border-mist pt-5 text-[14px] sm:grid-cols-2"
            >
              <div class="sm:col-span-2">
                <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">
                  Facility name
                </dt>
                <dd class="mt-1 font-serif text-xl text-ink">
                  {{ auth.currentFacility.name }}
                </dd>
              </div>
              <div>
                <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Type</dt>
                <dd class="mt-1 text-ink/80">
                  {{ FACILITY_TYPE_LABELS[auth.currentFacility.type] }}
                </dd>
              </div>
              <div>
                <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Location</dt>
                <dd class="mt-1 text-ink/80">
                  {{ auth.currentFacility.location }}
                </dd>
              </div>
              <div v-if="auth.currentFacilityStaff">
                <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Your role</dt>
                <dd class="mt-1 text-ink/80">
                  {{ STAFF_POSITION_LABELS[auth.currentFacilityStaff.position] }}
                </dd>
              </div>
              <div v-if="auth.currentFacilityStaff">
                <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Email</dt>
                <dd class="mt-1 break-all font-mono text-[13px] text-ink/80">
                  {{ auth.currentFacilityStaff.email }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Invite staff (stub) -->
        <div v-else-if="current === OnboardingStep.Invite" class="space-y-8">
          <div class="space-y-3">
            <h1 class="font-serif text-4xl font-semibold tracking-tight text-ink">
              Add your coworkers.
            </h1>
            <p class="text-[15px] text-ink/65">
              Invite anyone who'll help post shifts or review applicants. You
              can skip this and do it later — invites are not actually sent in
              the prototype.
            </p>
          </div>

          <div class="space-y-4 rounded-2xl border border-mist bg-bone p-8">
            <div class="space-y-2">
              <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="invite">
                Invite by email
              </Label>
              <div class="flex gap-2">
                <Input
                  id="invite"
                  v-model="inviteInput"
                  type="email"
                  placeholder="coworker@yourfacility.org.au"
                  class="h-12 rounded-xl border-mist bg-cream text-[15px]"
                  @keydown.enter.prevent="addInvite"
                />
                <Button
                  type="button"
                  variant="outline"
                  class="h-12 rounded-full border-ink px-5 text-ink hover:bg-ink/5"
                  @click="addInvite"
                >
                  Add
                </Button>
              </div>
            </div>

            <ul v-if="invitedEmails.length > 0" class="space-y-2">
              <li
                v-for="email in invitedEmails"
                :key="email"
                class="flex items-center justify-between rounded-xl border border-mist bg-cream px-4 py-3 text-[14px]"
              >
                <span class="font-mono text-ink/75">{{ email }}</span>
                <button
                  type="button"
                  class="cursor-pointer text-[12px] text-ink/55 underline-offset-4 hover:text-ink hover:underline"
                  @click="removeInvite(email)"
                >
                  Remove
                </button>
              </li>
            </ul>
            <p v-else class="text-[13px] italic text-ink/45">
              No one added yet. Skip if you want to do this later.
            </p>
          </div>
        </div>

        <!-- Done -->
        <div v-else-if="current === OnboardingStep.Done" class="space-y-8">
          <div class="space-y-3">
            <CheckCircle2 class="h-9 w-9 text-sage" />
            <h1 class="font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-ink">
              You're all set.
            </h1>
            <p class="text-[17px] leading-relaxed text-ink/70">
              ShiftLink is configured for {{ auth.currentFacility?.name }}.
              Head to your dashboard and post your first shift — applicants
              show up here as soon as professionals apply.
            </p>
          </div>

          <div class="rounded-2xl border border-mist bg-bone p-8">
            <p class="text-[12px] uppercase tracking-[0.18em] text-ink/55">
              Next up
            </p>
            <p class="mt-2 font-serif text-2xl text-ink">Post your first shift.</p>
            <p class="mt-1 text-[14px] text-ink/65">
              We'll take you straight to the dashboard.
            </p>
          </div>
        </div>
      </section>

      <!-- Nav -->
      <footer
        class="flex flex-col-reverse items-stretch gap-3 border-t border-mist pt-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <Button
          v-if="!isFirst && current !== OnboardingStep.Done"
          type="button"
          variant="ghost"
          class="text-ink/70 hover:bg-ink/5 hover:text-ink"
          @click="back"
        >
          <ArrowLeft class="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <span v-else />

        <Button
          v-if="current !== OnboardingStep.Done"
          type="button"
          class="h-12 rounded-full bg-marigold px-7 text-[15px] font-medium text-ink hover:bg-marigold/90"
          @click="next"
        >
          Continue
          <ArrowRight class="ml-1.5 h-4 w-4" />
        </Button>
        <Button
          v-else
          type="button"
          class="h-12 rounded-full bg-marigold px-7 text-[15px] font-medium text-ink hover:bg-marigold/90"
          @click="finish"
        >
          Go to dashboard
          <ArrowRight class="ml-1.5 h-4 w-4" />
        </Button>
      </footer>
    </div>
  </main>
</template>
