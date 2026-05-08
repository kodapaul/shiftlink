<script setup lang="ts">
import { computed } from 'vue'
import { useShiftApplications } from '@/modules/applications/composables/useShiftApplications'
import ApplicantRow from '@/modules/applications/components/ApplicantRow.vue'
import professionalsData from '@/data/professionals.json'
import type { Professional } from '@/modules/professional/types'
import { Inbox } from 'lucide-vue-next'

// Lists every application for a shift. Pending applicants get accept/decline
// actions; accepted/declined are read-only history. Reads professionals
// from the static seed for display (no separate professionals store yet).
const props = defineProps<{ shiftId: string }>()

const professionals = professionalsData as Professional[]

// Build a quick lookup from id to professional record so each row can
// resolve its applicant without repeated finds.
const professionalsById = computed(() => {
  const map = new Map<string, Professional>()
  for (const p of professionals) map.set(p.id, p)
  return map
})

const { applications, accept, decline, pendingCount } = useShiftApplications(
  () => props.shiftId,
)

function professionalFor(id: string): Professional | null {
  return professionalsById.value.get(id) ?? null
}
</script>

<template>
  <div class="space-y-4">
    <header class="flex items-center justify-between">
      <p class="text-[13px] text-ink/65">
        <span class="font-medium text-ink">{{ applications.length }}</span>
        {{ applications.length === 1 ? 'application' : 'applications' }}
        <span v-if="pendingCount > 0" class="text-ink/50">
          · {{ pendingCount }} pending
        </span>
      </p>
    </header>

    <div v-if="applications.length === 0" class="rounded-2xl border border-dashed border-mist bg-bone/60 px-6 py-14 text-center">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mist/70">
        <Inbox class="h-5 w-5 text-ink/55" />
      </div>
      <h3 class="mt-5 font-serif text-xl font-semibold tracking-tight text-ink">
        No applications yet.
      </h3>
      <p class="mt-2 text-[13px] text-ink/55">
        We'll surface this shift to qualified professionals nearby. Check back soon.
      </p>
    </div>

    <ul v-else class="space-y-3">
      <li v-for="application in applications" :key="application.id">
        <ApplicantRow
          :application="application"
          :professional="professionalFor(application.professionalId)"
          @accept="accept"
          @decline="decline"
        />
      </li>
    </ul>
  </div>
</template>
