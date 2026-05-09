<script setup lang="ts">
/**
 * Professional profile edit page (`/professional/edit`).
 *
 * Renders inside `PublicLayout` so the wordmark + nav + sign-out live in
 * `PublicHeader`. This view owns the dedicated profile-edit form. The
 * read-only summary is back at `/professional`'s Profile tab.
 *
 * Sections (matching the read-mode summary on the dashboard):
 *   1. Identity     — name, phone, DOB, right to work, languages
 *   2. Professional — role, years, AHPRA (conditional), last clinical
 *                     practice, specialties, skills, certifications
 *   3. Compliance   — WWCC number + expiry
 *   4. Preferences  — preferred locations, preferred shift types, available
 *                     from
 *   5. About        — bio (~280 char)
 *
 * On Save success, routes back to `/professional`. On Cancel, just routes
 * back without touching the auth store.
 */

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Edit2,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCircle2,
  X,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import DatePicker from '@/components/DatePicker.vue'
import { Role, ROLE_LABELS } from '@/modules/professional/enums/Role'
import {
  RightToWork,
  RIGHT_TO_WORK_LABELS,
} from '@/modules/professional/enums/RightToWork'
import {
  Specialty,
  SPECIALTY_LABELS,
} from '@/modules/professional/enums/Specialty'
import { ShiftType, SHIFT_TYPE_LABELS } from '@/modules/shifts/enums'
import { useProfessionalProfileForm } from '../composables/useProfessionalProfileForm'
import { roleRequiresAhpra } from '../services/ProfessionalProfileForm'
import ProfileCompletenessBadge from '../components/ProfileCompletenessBadge.vue'

const router = useRouter()
const { values, errors, status, completeness, save } = useProfessionalProfileForm()

/** Today as YYYY-MM-DD in local time. Used as min/max boundaries on the
 *  date pickers — DOB / last clinical practice can't be in the future,
 *  available-from can't be in the past. */
const todayISO = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

const roleOptions = Object.values(Role)
const rightToWorkOptions = Object.values(RightToWork)
const specialtyOptions = Object.values(Specialty)
const shiftTypeOptions = Object.values(ShiftType)

// Inline drafts for the multi-add string-list fields.
const languageDraft = ref('')
const certificationDraft = ref('')
const skillDraft = ref('')
const preferredLocationDraft = ref('')

function addToList(list: string[], draft: { value: string }) {
  const next = draft.value.trim()
  if (!next || list.includes(next)) {
    draft.value = ''
    return
  }
  list.push(next)
  draft.value = ''
}

function removeFromList(list: string[], item: string) {
  const idx = list.indexOf(item)
  if (idx !== -1) list.splice(idx, 1)
}

function toggleSpecialty(s: Specialty) {
  const idx = values.specialties.indexOf(s)
  if (idx === -1) values.specialties.push(s)
  else values.specialties.splice(idx, 1)
}

function toggleShiftType(t: ShiftType) {
  const idx = values.preferredShiftTypes.indexOf(t)
  if (idx === -1) values.preferredShiftTypes.push(t)
  else values.preferredShiftTypes.splice(idx, 1)
}

function handleSave() {
  const updated = save()
  if (updated) router.push('/professional')
}

function handleCancel() {
  router.push('/professional')
}
</script>

<template>
  <main class="px-6 pb-32 pt-12 sm:px-10 lg:px-12 lg:pt-16">
    <div class="mx-auto max-w-screen-2xl space-y-10">
      <!-- Header: back link + heading + completeness -->
      <header class="space-y-4">
        <RouterLink
          to="/professional"
          class="inline-flex items-center gap-1.5 text-[13px] text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft class="h-3.5 w-3.5" />
          Back to dashboard
        </RouterLink>

        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="space-y-2">
            <p class="text-[11px] uppercase tracking-[0.22em] text-ink/55">
              Edit profile
            </p>
            <h1
              class="font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl"
            >
              Your details.
            </h1>
            <p class="max-w-2xl text-[15px] leading-relaxed text-ink/65">
              Keep your profile current — facilities use this when reviewing
              applicants. Required fields gate applying to shifts later.
            </p>
          </div>
          <ProfileCompletenessBadge :completeness="completeness" />
        </div>
      </header>

      <!-- Form-level error banner -->
      <p
        v-if="errors.form"
        class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive"
      >
        <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
        <span>{{ errors.form }}</span>
      </p>

      <!-- Section: Identity -->
      <section class="space-y-6 rounded-2xl border border-mist bg-bone p-6 sm:p-8">
        <header class="flex items-center gap-2">
          <UserCircle2 class="h-4 w-4 text-ink/55" />
          <h2 class="font-serif text-xl font-semibold tracking-tight text-ink">
            Identity
          </h2>
        </header>

        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-2">
            <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="prof-name">
              Full name
            </Label>
            <Input
              id="prof-name"
              v-model="values.name"
              type="text"
              autocomplete="name"
              class="h-12 rounded-xl border-mist bg-cream text-[15px]"
            />
            <p
              v-if="errors.name"
              class="flex items-center gap-1.5 text-[12px] text-destructive"
            >
              <AlertCircle class="h-3 w-3" />
              {{ errors.name }}
            </p>
          </div>

          <div class="space-y-2">
            <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="prof-phone">
              Phone
            </Label>
            <Input
              id="prof-phone"
              v-model="values.phone"
              type="tel"
              autocomplete="tel"
              placeholder="04xx xxx xxx"
              class="h-12 rounded-xl border-mist bg-cream text-[15px]"
            />
            <p
              v-if="errors.phone"
              class="flex items-center gap-1.5 text-[12px] text-destructive"
            >
              <AlertCircle class="h-3 w-3" />
              {{ errors.phone }}
            </p>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-2">
            <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="prof-dob">
              Date of birth
            </Label>
            <DatePicker
              id="prof-dob"
              v-model="values.dateOfBirth"
              :max-date="todayISO"
              placeholder="Pick a date"
            />
            <p
              v-if="errors.dateOfBirth"
              class="flex items-center gap-1.5 text-[12px] text-destructive"
            >
              <AlertCircle class="h-3 w-3" />
              {{ errors.dateOfBirth }}
            </p>
          </div>

          <div class="space-y-2">
            <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="prof-rtw">
              Right to work
            </Label>
            <Select v-model="values.rightToWork">
              <SelectTrigger
                id="prof-rtw"
                class="h-12 w-full rounded-xl border-mist bg-cream text-[15px]"
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in rightToWorkOptions" :key="opt" :value="opt">
                  {{ RIGHT_TO_WORK_LABELS[opt] }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p
              v-if="errors.rightToWork"
              class="flex items-center gap-1.5 text-[12px] text-destructive"
            >
              <AlertCircle class="h-3 w-3" />
              {{ errors.rightToWork }}
            </p>
          </div>
        </div>

        <!-- Languages multi-add -->
        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="prof-language">
            Languages
            <span class="ml-1 normal-case tracking-normal text-ink/40">(press Enter to add)</span>
          </Label>
          <div class="flex gap-2">
            <Input
              id="prof-language"
              v-model="languageDraft"
              type="text"
              placeholder="e.g. Mandarin"
              class="h-12 rounded-xl border-mist bg-cream text-[15px]"
              @keydown.enter.prevent="addToList(values.languages, languageDraft as unknown as { value: string })"
            />
            <Button
              type="button"
              variant="outline"
              class="h-12 rounded-full border-ink px-4 text-ink hover:bg-ink/5"
              @click="addToList(values.languages, languageDraft as unknown as { value: string })"
            >
              <Plus class="h-4 w-4" />
            </Button>
          </div>
          <ul v-if="values.languages.length > 0" class="flex flex-wrap gap-2 pt-1">
            <li
              v-for="lang in values.languages"
              :key="lang"
              class="inline-flex items-center gap-1.5 rounded-full bg-mist/55 px-3 py-1 text-[13px] text-ink"
            >
              {{ lang }}
              <button
                type="button"
                aria-label="Remove"
                class="cursor-pointer rounded-full p-0.5 text-ink/55 hover:bg-ink/5 hover:text-ink"
                @click="removeFromList(values.languages, lang)"
              >
                <X class="h-3 w-3" />
              </button>
            </li>
          </ul>
        </div>
      </section>

      <!-- Section: Professional -->
      <section class="space-y-6 rounded-2xl border border-mist bg-bone p-6 sm:p-8">
        <header class="flex items-center gap-2">
          <Stethoscope class="h-4 w-4 text-ink/55" />
          <h2 class="font-serif text-xl font-semibold tracking-tight text-ink">
            Professional
          </h2>
        </header>

        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-2">
            <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="prof-role">
              Role
            </Label>
            <Select v-model="values.role">
              <SelectTrigger
                id="prof-role"
                class="h-12 w-full rounded-xl border-mist bg-cream text-[15px]"
              >
                <SelectValue placeholder="Pick a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in roleOptions" :key="opt" :value="opt">
                  {{ ROLE_LABELS[opt] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="prof-years">
              Years of experience
            </Label>
            <Input
              id="prof-years"
              v-model="values.yearsExperience"
              type="number"
              inputmode="numeric"
              :min="0"
              :max="60"
              class="h-12 rounded-xl border-mist bg-cream text-[15px]"
            />
            <p
              v-if="errors.yearsExperience"
              class="flex items-center gap-1.5 text-[12px] text-destructive"
            >
              <AlertCircle class="h-3 w-3" />
              {{ errors.yearsExperience }}
            </p>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div v-if="roleRequiresAhpra(values.role)" class="space-y-2">
            <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="prof-ahpra">
              AHPRA number
            </Label>
            <Input
              id="prof-ahpra"
              v-model="values.ahpraNumber"
              type="text"
              placeholder="NMW0001234567"
              class="h-12 rounded-xl border-mist bg-cream font-mono text-[14px]"
            />
            <p
              v-if="errors.ahpraNumber"
              class="flex items-center gap-1.5 text-[12px] text-destructive"
            >
              <AlertCircle class="h-3 w-3" />
              {{ errors.ahpraNumber }}
            </p>
          </div>

          <div class="space-y-2">
            <Label
              class="text-[11px] uppercase tracking-[0.18em] text-ink/55"
              for="prof-last-practice"
            >
              Last clinical practice
            </Label>
            <DatePicker
              id="prof-last-practice"
              v-model="values.lastClinicalPractice"
              :max-date="todayISO"
              placeholder="Pick a date"
            />
            <p
              v-if="errors.lastClinicalPractice"
              class="flex items-center gap-1.5 text-[12px] text-destructive"
            >
              <AlertCircle class="h-3 w-3" />
              {{ errors.lastClinicalPractice }}
            </p>
          </div>
        </div>

        <!-- Specialties multi-select -->
        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55">
            Specialties
          </Label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in specialtyOptions"
              :key="opt"
              type="button"
              :class="[
                'cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition-colors',
                values.specialties.includes(opt)
                  ? 'border-ink bg-ink text-cream'
                  : 'border-mist bg-cream text-ink/70 hover:border-ink/30 hover:text-ink',
              ]"
              @click="toggleSpecialty(opt)"
            >
              <Check
                v-if="values.specialties.includes(opt)"
                class="-ml-0.5 mr-1 inline h-3 w-3"
              />
              {{ SPECIALTY_LABELS[opt] }}
            </button>
          </div>
        </div>

        <!-- Skills multi-add -->
        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="prof-skill">
            Skills
            <span class="ml-1 normal-case tracking-normal text-ink/40">(e.g. IV cannulation)</span>
          </Label>
          <div class="flex gap-2">
            <Input
              id="prof-skill"
              v-model="skillDraft"
              type="text"
              placeholder="Add a skill"
              class="h-12 rounded-xl border-mist bg-cream text-[15px]"
              @keydown.enter.prevent="addToList(values.skills, skillDraft as unknown as { value: string })"
            />
            <Button
              type="button"
              variant="outline"
              class="h-12 rounded-full border-ink px-4 text-ink hover:bg-ink/5"
              @click="addToList(values.skills, skillDraft as unknown as { value: string })"
            >
              <Plus class="h-4 w-4" />
            </Button>
          </div>
          <ul v-if="values.skills.length > 0" class="flex flex-wrap gap-2 pt-1">
            <li
              v-for="s in values.skills"
              :key="s"
              class="inline-flex items-center gap-1.5 rounded-full bg-mist/55 px-3 py-1 text-[13px] text-ink"
            >
              {{ s }}
              <button
                type="button"
                aria-label="Remove"
                class="cursor-pointer rounded-full p-0.5 text-ink/55 hover:bg-ink/5 hover:text-ink"
                @click="removeFromList(values.skills, s)"
              >
                <X class="h-3 w-3" />
              </button>
            </li>
          </ul>
        </div>

        <!-- Certifications multi-add -->
        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="prof-cert">
            Certifications
            <span class="ml-1 normal-case tracking-normal text-ink/40">(ALS, First Aid, etc.)</span>
          </Label>
          <div class="flex gap-2">
            <Input
              id="prof-cert"
              v-model="certificationDraft"
              type="text"
              placeholder="Add a certification"
              class="h-12 rounded-xl border-mist bg-cream text-[15px]"
              @keydown.enter.prevent="addToList(values.certifications, certificationDraft as unknown as { value: string })"
            />
            <Button
              type="button"
              variant="outline"
              class="h-12 rounded-full border-ink px-4 text-ink hover:bg-ink/5"
              @click="addToList(values.certifications, certificationDraft as unknown as { value: string })"
            >
              <Plus class="h-4 w-4" />
            </Button>
          </div>
          <ul
            v-if="values.certifications.length > 0"
            class="flex flex-wrap gap-2 pt-1"
          >
            <li
              v-for="c in values.certifications"
              :key="c"
              class="inline-flex items-center gap-1.5 rounded-full bg-mist/55 px-3 py-1 text-[13px] text-ink"
            >
              {{ c }}
              <button
                type="button"
                aria-label="Remove"
                class="cursor-pointer rounded-full p-0.5 text-ink/55 hover:bg-ink/5 hover:text-ink"
                @click="removeFromList(values.certifications, c)"
              >
                <X class="h-3 w-3" />
              </button>
            </li>
          </ul>
        </div>
      </section>

      <!-- Section: Compliance -->
      <section class="space-y-6 rounded-2xl border border-mist bg-bone p-6 sm:p-8">
        <header class="flex items-center gap-2">
          <ShieldCheck class="h-4 w-4 text-ink/55" />
          <h2 class="font-serif text-xl font-semibold tracking-tight text-ink">
            Compliance
          </h2>
        </header>

        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-2">
            <Label
              class="text-[11px] uppercase tracking-[0.18em] text-ink/55"
              for="prof-wwcc-number"
            >
              WWCC number
            </Label>
            <Input
              id="prof-wwcc-number"
              v-model="values.wwccNumber"
              type="text"
              placeholder="WWC0123456E"
              class="h-12 rounded-xl border-mist bg-cream font-mono text-[14px]"
            />
            <p
              v-if="errors.wwccNumber"
              class="flex items-center gap-1.5 text-[12px] text-destructive"
            >
              <AlertCircle class="h-3 w-3" />
              {{ errors.wwccNumber }}
            </p>
          </div>

          <div class="space-y-2">
            <Label
              class="text-[11px] uppercase tracking-[0.18em] text-ink/55"
              for="prof-wwcc-expiry"
            >
              WWCC expiry
            </Label>
            <!-- WWCC expiry: no min/max — both expired-and-renewing and
                 currently-valid users hit this field, so we let any date be
                 picked and rely on the visible expiry to prompt renewal. -->
            <DatePicker
              id="prof-wwcc-expiry"
              v-model="values.wwccExpiry"
              placeholder="Pick a date"
            />
            <p
              v-if="errors.wwccExpiry"
              class="flex items-center gap-1.5 text-[12px] text-destructive"
            >
              <AlertCircle class="h-3 w-3" />
              {{ errors.wwccExpiry }}
            </p>
          </div>
        </div>
      </section>

      <!-- Section: Preferences -->
      <section class="space-y-6 rounded-2xl border border-mist bg-bone p-6 sm:p-8">
        <header class="flex items-center gap-2">
          <Sparkles class="h-4 w-4 text-ink/55" />
          <h2 class="font-serif text-xl font-semibold tracking-tight text-ink">
            Preferences
          </h2>
        </header>

        <!-- Preferred locations multi-add -->
        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="prof-loc">
            Preferred locations
            <span class="ml-1 normal-case tracking-normal text-ink/40">
              (suburb or postcode)
            </span>
          </Label>
          <div class="flex gap-2">
            <Input
              id="prof-loc"
              v-model="preferredLocationDraft"
              type="text"
              placeholder="e.g. Bondi, NSW 2026"
              class="h-12 rounded-xl border-mist bg-cream text-[15px]"
              @keydown.enter.prevent="addToList(values.preferredLocations, preferredLocationDraft as unknown as { value: string })"
            />
            <Button
              type="button"
              variant="outline"
              class="h-12 rounded-full border-ink px-4 text-ink hover:bg-ink/5"
              @click="addToList(values.preferredLocations, preferredLocationDraft as unknown as { value: string })"
            >
              <Plus class="h-4 w-4" />
            </Button>
          </div>
          <ul
            v-if="values.preferredLocations.length > 0"
            class="flex flex-wrap gap-2 pt-1"
          >
            <li
              v-for="loc in values.preferredLocations"
              :key="loc"
              class="inline-flex items-center gap-1.5 rounded-full bg-mist/55 px-3 py-1 text-[13px] text-ink"
            >
              {{ loc }}
              <button
                type="button"
                aria-label="Remove"
                class="cursor-pointer rounded-full p-0.5 text-ink/55 hover:bg-ink/5 hover:text-ink"
                @click="removeFromList(values.preferredLocations, loc)"
              >
                <X class="h-3 w-3" />
              </button>
            </li>
          </ul>
        </div>

        <!-- Preferred shift types -->
        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55">
            Preferred shift types
          </Label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="t in shiftTypeOptions"
              :key="t"
              type="button"
              :class="[
                'cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition-colors',
                values.preferredShiftTypes.includes(t)
                  ? 'border-ink bg-ink text-cream'
                  : 'border-mist bg-cream text-ink/70 hover:border-ink/30 hover:text-ink',
              ]"
              @click="toggleShiftType(t)"
            >
              <Check
                v-if="values.preferredShiftTypes.includes(t)"
                class="-ml-0.5 mr-1 inline h-3 w-3"
              />
              {{ SHIFT_TYPE_LABELS[t] }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <Label
            class="text-[11px] uppercase tracking-[0.18em] text-ink/55"
            for="prof-available-from"
          >
            Available from
          </Label>
          <DatePicker
            id="prof-available-from"
            v-model="values.availableFrom"
            :min-date="todayISO"
            placeholder="Pick a date"
          />
          <p
            v-if="errors.availableFrom"
            class="flex items-center gap-1.5 text-[12px] text-destructive"
          >
            <AlertCircle class="h-3 w-3" />
            {{ errors.availableFrom }}
          </p>
        </div>
      </section>

      <!-- Section: About -->
      <section class="space-y-4 rounded-2xl border border-mist bg-bone p-6 sm:p-8">
        <header class="flex items-center gap-2">
          <Edit2 class="h-4 w-4 text-ink/55" />
          <h2 class="font-serif text-xl font-semibold tracking-tight text-ink">
            About
          </h2>
        </header>

        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="prof-bio">
            Bio
            <span class="ml-1 normal-case tracking-normal text-ink/40">
              (~280 chars)
            </span>
          </Label>
          <Textarea
            id="prof-bio"
            v-model="values.bio"
            rows="4"
            maxlength="280"
            placeholder="Two or three sentences. Where have you worked? What do you bring?"
            class="rounded-xl border-mist bg-cream text-[15px]"
          />
          <div class="flex items-center justify-between text-[12px] text-ink/55">
            <span v-if="errors.bio" class="flex items-center gap-1.5 text-destructive">
              <AlertCircle class="h-3 w-3" />
              {{ errors.bio }}
            </span>
            <span v-else />
            <span class="tabular-nums">{{ values.bio.length }} / 280</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Sticky save bar — pinned to the bottom so save/cancel stay reachable
         without needing to scroll back to the top of the form. Matches the
         dashboard's `max-w-screen-2xl` so the bar aligns with the form
         content above it. -->
    <div
      class="sticky bottom-0 left-0 right-0 z-10 mx-auto mt-10 max-w-screen-2xl border-t border-mist bg-cream/90 px-2 py-4 backdrop-blur"
    >
      <div class="flex items-center justify-between gap-3">
        <span class="hidden text-[12px] text-ink/55 sm:inline">
          Changes save to your profile and update what facilities see.
        </span>
        <span class="sm:hidden" />
        <div class="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            class="h-11 rounded-full px-5 text-[13px] text-ink/65 hover:bg-ink/5 hover:text-ink"
            @click="handleCancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            :disabled="status === 'submitting'"
            class="h-11 rounded-full bg-marigold px-6 text-[13px] font-medium text-ink hover:bg-marigold/90"
            @click="handleSave"
          >
            <Save class="mr-1.5 h-3.5 w-3.5" />
            {{ status === 'submitting' ? 'Saving…' : 'Save changes' }}
          </Button>
        </div>
      </div>
    </div>
  </main>
</template>
