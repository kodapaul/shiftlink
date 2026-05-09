<script setup lang="ts">
/**
 * Shows the "Profile X% complete" indicator that sits above the profile
 * form. Two visual states:
 *   - Complete: sage pill with a check icon, text "Profile complete".
 *   - Incomplete: marigold-tinted pill with a percentage and an inline
 *     mention of the next missing required field. The field name is
 *     plain-text humanised (camelCase → "Date of birth" etc.).
 *
 * Pure presentational — consumes the `completeness` shape returned by
 * `services/ProfessionalProfileForm.ts#computeProfileCompleteness`.
 */

import { computed } from 'vue'
import { CheckCircle2, AlertCircle } from 'lucide-vue-next'
import type {
  ProfessionalProfileCompleteness,
  ProfessionalProfileFormValues,
} from '../types'

const props = defineProps<{
  completeness: ProfessionalProfileCompleteness
}>()

const FIELD_LABELS: Record<keyof ProfessionalProfileFormValues, string> = {
  name: 'Full name',
  phone: 'Phone',
  dateOfBirth: 'Date of birth',
  rightToWork: 'Right to work',
  languages: 'Languages',
  role: 'Role',
  yearsExperience: 'Years of experience',
  ahpraNumber: 'AHPRA number',
  lastClinicalPractice: 'Last clinical practice',
  specialties: 'Specialties',
  skills: 'Skills',
  certifications: 'Certifications',
  wwccNumber: 'WWCC number',
  wwccExpiry: 'WWCC expiry',
  preferredLocations: 'Preferred locations',
  preferredShiftTypes: 'Preferred shift types',
  availableFrom: 'Available from',
  bio: 'Bio',
}

const nextMissingLabel = computed<string | null>(() => {
  const first = props.completeness.missing[0]
  return first ? FIELD_LABELS[first] : null
})
</script>

<template>
  <div
    v-if="completeness.isComplete"
    class="inline-flex items-center gap-2 rounded-full border border-sage/60 bg-sage/30 px-3 py-1.5 text-[12px] font-medium text-ink"
  >
    <CheckCircle2 class="h-3.5 w-3.5" />
    Profile complete
  </div>

  <div
    v-else
    class="inline-flex items-center gap-2.5 rounded-full border border-marigold/60 bg-marigold/15 px-3 py-1.5 text-[12px] text-ink"
  >
    <AlertCircle class="h-3.5 w-3.5 text-ink/65" />
    <span>
      <span class="font-medium">{{ completeness.percentage }}% complete</span>
      <span class="ml-2 text-ink/55">
        {{ completeness.requiredFilled }} / {{ completeness.requiredTotal }} required fields
      </span>
    </span>
    <span
      v-if="nextMissingLabel"
      class="hidden border-l border-ink/15 pl-2.5 text-ink/55 sm:inline"
    >
      Next: <span class="text-ink/75">{{ nextMissingLabel }}</span>
    </span>
  </div>
</template>
