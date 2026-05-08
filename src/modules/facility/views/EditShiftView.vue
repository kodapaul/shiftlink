<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShiftsStore } from '@/stores/shifts'
import facilitiesData from '@/data/facilities.json'
import type { Facility } from '@/modules/facility/types'
import PostShiftForm from '../components/PostShiftForm.vue'
import { ArrowLeft } from 'lucide-vue-next'

const facilities = facilitiesData as Facility[]
const route = useRoute()
const router = useRouter()
const shifts = useShiftsStore()

const shiftId = computed(() => String(route.params.id))

// Single-facility model — there's only one facility in the seed.
const facility = computed<Facility | null>(() => facilities[0] ?? null)

const targetShift = computed(() => shifts.getById(shiftId.value))

// With a single facility, "ownership" reduces to "the shift exists."
const ownsShift = computed(() => !!targetShift.value)
</script>

<template>
  <div class="min-h-svh bg-cream">
    <header class="px-6 pt-10 pb-6 md:px-12 md:pt-14 md:pb-8">
      <div class="mx-auto max-w-3xl">
        <button
          type="button"
          class="group inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-[13px] text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
          @click="router.push('/facility')"
        >
          <ArrowLeft class="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to dashboard
        </button>

        <p class="mt-8 text-[11px] uppercase tracking-[0.22em] text-ink/45">
          {{ facility?.name ?? 'Facility' }}
        </p>
        <h1 class="mt-3 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-ink md:text-[52px]">
          Edit shift.
        </h1>
        <p class="mt-3 max-w-prose text-base leading-relaxed text-ink/65 md:text-lg">
          Adjust the details and we'll update this opening for any professional who hasn't claimed it yet.
        </p>
      </div>
    </header>

    <section class="px-6 pb-24 md:px-12">
      <div class="mx-auto max-w-3xl">
        <!-- Owned shift — render the form -->
        <PostShiftForm v-if="targetShift && ownsShift" :editing-shift-id="shiftId" />

        <!-- Not found, or another facility's shift — error state -->
        <div
          v-else
          class="rounded-2xl border border-mist bg-bone px-6 py-10 text-center"
        >
          <h2 class="font-serif text-2xl font-semibold tracking-tight text-ink">
            Shift not found.
          </h2>
          <p class="mt-3 text-sm text-ink/60">
            The shift may have been deleted or the URL is wrong.
          </p>
          <button
            type="button"
            class="mt-6 inline-flex h-10 cursor-pointer items-center rounded-full bg-ink px-5 text-[13px] font-medium text-cream hover:bg-ink/90"
            @click="router.push('/facility')"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
