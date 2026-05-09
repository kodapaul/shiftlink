<script setup lang="ts">
/**
 * Staff registration form — presentational only.
 *
 * Three sections: a read-only "your facility" info card (single-facility
 * model — every account is bound to the seeded facility), the staff fields,
 * and credentials. All state and submit logic lives in
 * `useStaffRegistrationForm`, which calls into the pure service.
 */
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Building2, Info, Lock, UserCircle2 } from 'lucide-vue-next'
import facilitiesData from '@/data/facilities.json'
import type { Facility } from '@/modules/facility/types'
import { FACILITY_TYPE_LABELS } from '@/modules/facility/enums/FacilityType'
import {
  STAFF_POSITION_LABELS,
  StaffPosition,
} from '@/modules/facility/enums/StaffPosition'
import { useStaffRegistrationForm } from '../composables/useStaffRegistrationForm'
import { SINGLE_FACILITY_ID } from '../services/StaffRegistrationForm'

const { values, errors, status, submit } = useStaffRegistrationForm()

// Single-facility model — every registration is bound to this facility.
// Read it directly from the seed since the user isn't signed in yet, so
// `auth.currentFacility` is null until after submit().
const facilities = facilitiesData as Facility[]
const assignedFacility = facilities.find((f) => f.id === SINGLE_FACILITY_ID) ?? facilities[0]

const staffPositionOptions = Object.values(StaffPosition)
</script>

<template>
  <form class="space-y-12" @submit.prevent="submit">
    <!-- Form-level error banner -->
    <p
      v-if="errors.form"
      class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
      <span>{{ errors.form }}</span>
    </p>

    <!-- Section 1: Facility (read-only) -->
    <section class="space-y-4">
      <h3
        class="flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-ink"
      >
        <Building2 class="h-4 w-4 text-ink/55" />
        Your facility
      </h3>

      <div class="rounded-2xl border border-mist bg-mist/40 p-5">
        <div class="flex items-start gap-3">
          <Info class="mt-0.5 h-4 w-4 shrink-0 text-ink/55" />
          <p class="text-[13px] leading-relaxed text-ink/70">
            For this prototype, every new account is assigned to the demo
            facility below. Building multi-facility tenancy isn't part of the
            brief, so we keep one shared workspace.
          </p>
        </div>

        <dl
          v-if="assignedFacility"
          class="mt-5 grid gap-4 border-t border-mist pt-5 text-[13px] sm:grid-cols-3"
        >
          <div>
            <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Name</dt>
            <dd class="mt-1 font-medium text-ink">{{ assignedFacility.name }}</dd>
          </div>
          <div>
            <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Type</dt>
            <dd class="mt-1 text-ink/80">
              {{ FACILITY_TYPE_LABELS[assignedFacility.type] }}
            </dd>
          </div>
          <div>
            <dt class="text-[10px] uppercase tracking-[0.18em] text-ink/45">Location</dt>
            <dd class="mt-1 text-ink/80">{{ assignedFacility.location }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- Section 2: Staff -->
    <fieldset class="space-y-6">
      <legend
        class="mb-2 flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-ink"
      >
        <UserCircle2 class="h-4 w-4 text-ink/55" />
        About you
      </legend>

      <div class="grid gap-6 md:grid-cols-2">
        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="staffName">
            Full name
          </Label>
          <Input
            id="staffName"
            v-model="values.staffName"
            type="text"
            autocomplete="name"
            placeholder="e.g. Sarah Whitfield"
            maxlength="80"
            class="h-12 rounded-xl border-mist bg-bone text-[15px]"
          />
          <p
            v-if="errors.staffName"
            class="flex items-center gap-1.5 text-[12px] text-destructive"
          >
            <AlertCircle class="h-3 w-3" />
            {{ errors.staffName }}
          </p>
        </div>

        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="staffPosition">
            Your role
          </Label>
          <Select v-model="values.staffPosition">
            <SelectTrigger
              id="staffPosition"
              class="h-12 w-full rounded-xl border-mist bg-bone text-[15px]"
            >
              <SelectValue placeholder="Pick a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in staffPositionOptions"
                :key="option"
                :value="option"
              >
                {{ STAFF_POSITION_LABELS[option] }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p
            v-if="errors.staffPosition"
            class="flex items-center gap-1.5 text-[12px] text-destructive"
          >
            <AlertCircle class="h-3 w-3" />
            {{ errors.staffPosition }}
          </p>
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="staffEmail">
            Work email
          </Label>
          <Input
            id="staffEmail"
            v-model="values.staffEmail"
            type="email"
            autocomplete="email"
            placeholder="you@yourfacility.org.au"
            maxlength="120"
            class="h-12 rounded-xl border-mist bg-bone text-[15px]"
          />
          <p
            v-if="errors.staffEmail"
            class="flex items-center gap-1.5 text-[12px] text-destructive"
          >
            <AlertCircle class="h-3 w-3" />
            {{ errors.staffEmail }}
          </p>
        </div>

        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="staffPhone">
            Phone
            <span class="ml-1 normal-case tracking-normal text-ink/40">(optional)</span>
          </Label>
          <Input
            id="staffPhone"
            v-model="values.staffPhone"
            type="tel"
            autocomplete="tel"
            placeholder="04xx xxx xxx"
            maxlength="32"
            class="h-12 rounded-xl border-mist bg-bone text-[15px]"
          />
        </div>
      </div>
    </fieldset>

    <!-- Section 3: Credentials -->
    <fieldset class="space-y-6">
      <legend
        class="mb-2 flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-ink"
      >
        <Lock class="h-4 w-4 text-ink/55" />
        Pick a password
      </legend>

      <div class="grid gap-6 md:grid-cols-2">
        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="password">
            Password
          </Label>
          <Input
            id="password"
            v-model="values.password"
            type="password"
            autocomplete="new-password"
            placeholder="At least 6 characters"
            class="h-12 rounded-xl border-mist bg-bone text-[15px]"
          />
          <p
            v-if="errors.password"
            class="flex items-center gap-1.5 text-[12px] text-destructive"
          >
            <AlertCircle class="h-3 w-3" />
            {{ errors.password }}
          </p>
        </div>

        <div class="space-y-2">
          <Label
            class="text-[11px] uppercase tracking-[0.18em] text-ink/55"
            for="confirmPassword"
          >
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            v-model="values.confirmPassword"
            type="password"
            autocomplete="new-password"
            placeholder="Re-enter your password"
            class="h-12 rounded-xl border-mist bg-bone text-[15px]"
          />
          <p
            v-if="errors.confirmPassword"
            class="flex items-center gap-1.5 text-[12px] text-destructive"
          >
            <AlertCircle class="h-3 w-3" />
            {{ errors.confirmPassword }}
          </p>
        </div>
      </div>
      <p class="text-[12px] text-ink/45">
        This is a prototype — passwords are not stored or checked. Pick anything 6+ characters.
      </p>
    </fieldset>

    <!-- Actions -->
    <div class="border-t border-mist pt-6">
      <Button
        type="submit"
        :disabled="status === 'submitting'"
        class="h-12 w-full rounded-full bg-marigold text-[15px] font-medium text-ink hover:bg-marigold/90"
      >
        {{ status === 'submitting' ? 'Creating account…' : 'Create my account' }}
      </Button>
    </div>
  </form>
</template>
