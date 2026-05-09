<script setup lang="ts">
/**
 * Profile tab on `/professional` — read-only summary.
 *
 * Renders the active professional's record sectioned the same way as the
 * edit form (Identity / Professional / Compliance / Preferences / About).
 * Editing happens on a dedicated route at `/professional/edit` — clicking
 * "Edit profile" is a routing change, not an in-place toggle.
 *
 * Completeness for the badge is derived by running the same form-values
 * pipeline used by the edit view: `populate → compute`. Keeps the
 * percentage consistent across the two screens.
 */

import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Edit2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCircle2,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/helpers/format'
import { ROLE_LABELS } from '@/modules/professional/enums/Role'
import { RIGHT_TO_WORK_LABELS } from '@/modules/professional/enums/RightToWork'
import {
  Specialty,
  SPECIALTY_LABELS,
} from '@/modules/professional/enums/Specialty'
import { ShiftType, SHIFT_TYPE_LABELS } from '@/modules/shifts/enums'
import {
  computeProfileCompleteness,
  emptyProfessionalProfileForm,
  populateProfessionalProfileForm,
  roleRequiresAhpra,
} from '../services/ProfessionalProfileForm'
import ProfileCompletenessBadge from './ProfileCompletenessBadge.vue'

const auth = useAuthStore()

const proRecord = computed(() => auth.currentProfessional)

/** Form-shaped view of the saved record — fed into `computeProfileCompleteness`
 *  so the badge here matches the badge on the edit page. */
const completeness = computed(() => {
  const values = proRecord.value
    ? populateProfessionalProfileForm(proRecord.value)
    : emptyProfessionalProfileForm()
  return computeProfileCompleteness(values)
})

function joinList(list: ReadonlyArray<string> | undefined): string {
  if (!list || list.length === 0) return '—'
  return list.join(', ')
}
function joinSpecialties(list: ReadonlyArray<Specialty> | undefined): string {
  if (!list || list.length === 0) return '—'
  return list.map((s) => SPECIALTY_LABELS[s]).join(', ')
}
function joinShiftTypes(list: ReadonlyArray<ShiftType> | undefined): string {
  if (!list || list.length === 0) return '—'
  return list.map((t) => SHIFT_TYPE_LABELS[t]).join(', ')
}

const wwccDisplay = computed(() => {
  const n = proRecord.value?.wwcc?.number
  const e = proRecord.value?.wwcc?.expiry
  if (!n || !e) return '—'
  return `${n} · expires ${formatDate(e)}`
})
</script>

<template>
  <div v-if="proRecord" class="space-y-8">
    <!-- Header: completeness + edit link -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <ProfileCompletenessBadge :completeness="completeness" />
      <Button
        as-child
        variant="outline"
        class="h-10 rounded-full border-ink/20 px-4 text-[13px] hover:bg-ink/5"
      >
        <RouterLink to="/professional/edit">
          <Edit2 class="mr-1.5 h-3.5 w-3.5" />
          Edit profile
        </RouterLink>
      </Button>
    </div>

    <!-- Section: Identity -->
    <section class="rounded-2xl border border-mist bg-bone p-6 sm:p-8">
      <header class="mb-5 flex items-center gap-2">
        <UserCircle2 class="h-4 w-4 text-ink/55" />
        <h3 class="font-serif text-xl font-semibold tracking-tight text-ink">
          Identity
        </h3>
      </header>
      <dl class="grid gap-x-8 gap-y-4 text-[14px] sm:grid-cols-2">
        <div>
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Name</dt>
          <dd class="mt-1 font-medium text-ink">{{ proRecord.name }}</dd>
        </div>
        <div>
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Email</dt>
          <dd class="mt-1 break-all font-mono text-[13px] text-ink/80">
            {{ proRecord.email }}
          </dd>
        </div>
        <div>
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Phone</dt>
          <dd class="mt-1 text-ink/80">{{ proRecord.phone || '—' }}</dd>
        </div>
        <div>
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">
            Date of birth
          </dt>
          <dd class="mt-1 text-ink/80">
            {{ proRecord.dateOfBirth ? formatDate(proRecord.dateOfBirth) : '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">
            Right to work
          </dt>
          <dd class="mt-1 text-ink/80">
            {{
              proRecord.rightToWork
                ? RIGHT_TO_WORK_LABELS[proRecord.rightToWork]
                : '—'
            }}
          </dd>
        </div>
        <div>
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Languages</dt>
          <dd class="mt-1 text-ink/80">{{ joinList(proRecord.languages) }}</dd>
        </div>
      </dl>
    </section>

    <!-- Section: Professional -->
    <section class="rounded-2xl border border-mist bg-bone p-6 sm:p-8">
      <header class="mb-5 flex items-center gap-2">
        <Stethoscope class="h-4 w-4 text-ink/55" />
        <h3 class="font-serif text-xl font-semibold tracking-tight text-ink">
          Professional
        </h3>
      </header>
      <dl class="grid gap-x-8 gap-y-4 text-[14px] sm:grid-cols-2">
        <div>
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Role</dt>
          <dd class="mt-1 font-medium text-ink">
            {{ ROLE_LABELS[proRecord.role] }}
          </dd>
        </div>
        <div>
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">
            Years of experience
          </dt>
          <dd class="mt-1 text-ink/80">
            {{ proRecord.yearsExperience ?? '—' }}
          </dd>
        </div>
        <div v-if="roleRequiresAhpra(proRecord.role)">
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">
            AHPRA number
          </dt>
          <dd class="mt-1 font-mono text-[13px] text-ink/80">
            {{ proRecord.ahpraNumber || '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">
            Last clinical practice
          </dt>
          <dd class="mt-1 text-ink/80">
            {{
              proRecord.lastClinicalPractice
                ? formatDate(proRecord.lastClinicalPractice)
                : '—'
            }}
          </dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">
            Specialties
          </dt>
          <dd class="mt-1 text-ink/80">
            {{ joinSpecialties(proRecord.specialties) }}
          </dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Skills</dt>
          <dd class="mt-1 text-ink/80">{{ joinList(proRecord.skills) }}</dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">
            Certifications
          </dt>
          <dd class="mt-1 text-ink/80">
            {{ joinList(proRecord.certifications) }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- Section: Compliance -->
    <section class="rounded-2xl border border-mist bg-bone p-6 sm:p-8">
      <header class="mb-5 flex items-center gap-2">
        <ShieldCheck class="h-4 w-4 text-ink/55" />
        <h3 class="font-serif text-xl font-semibold tracking-tight text-ink">
          Compliance
        </h3>
      </header>
      <dl class="grid gap-x-8 gap-y-4 text-[14px]">
        <div>
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">
            Working With Children Check
          </dt>
          <dd class="mt-1 text-ink/80">{{ wwccDisplay }}</dd>
        </div>
      </dl>
    </section>

    <!-- Section: Preferences -->
    <section class="rounded-2xl border border-mist bg-bone p-6 sm:p-8">
      <header class="mb-5 flex items-center gap-2">
        <Sparkles class="h-4 w-4 text-ink/55" />
        <h3 class="font-serif text-xl font-semibold tracking-tight text-ink">
          Preferences
        </h3>
      </header>
      <dl class="grid gap-x-8 gap-y-4 text-[14px] sm:grid-cols-2">
        <div class="sm:col-span-2">
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">
            Preferred locations
          </dt>
          <dd class="mt-1 text-ink/80">
            {{ joinList(proRecord.preferredLocations) }}
          </dd>
        </div>
        <div>
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">
            Preferred shift types
          </dt>
          <dd class="mt-1 text-ink/80">
            {{ joinShiftTypes(proRecord.preferredShiftTypes) }}
          </dd>
        </div>
        <div>
          <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">
            Available from
          </dt>
          <dd class="mt-1 text-ink/80">
            {{ proRecord.availableFrom ? formatDate(proRecord.availableFrom) : '—' }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- Section: About -->
    <section class="rounded-2xl border border-mist bg-bone p-6 sm:p-8">
      <header class="mb-5 flex items-center gap-2">
        <Edit2 class="h-4 w-4 text-ink/55" />
        <h3 class="font-serif text-xl font-semibold tracking-tight text-ink">
          About
        </h3>
      </header>
      <p
        v-if="proRecord.bio"
        class="text-[15px] leading-relaxed text-ink/80"
      >
        {{ proRecord.bio }}
      </p>
      <p v-else class="text-[14px] italic text-ink/45">
        No bio yet. Add a couple of sentences so facilities know who they're
        hiring.
      </p>
    </section>
  </div>
</template>
