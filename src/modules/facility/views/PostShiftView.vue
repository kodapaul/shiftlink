<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import facilitiesData from '@/data/facilities.json'
import type { Facility } from '@/modules/facility/types'
import PostShiftForm from '../components/PostShiftForm.vue'
import { ArrowLeft } from 'lucide-vue-next'

const facilities = facilitiesData as Facility[]
const auth = useAuthStore()
const router = useRouter()

const facility = computed<Facility | null>(() =>
  auth.facilityId ? facilities.find((f) => f.id === auth.facilityId) ?? null : null,
)
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
          Post a shift.
        </h1>
        <p class="mt-3 max-w-prose text-base leading-relaxed text-ink/65 md:text-lg">
          A few details and we'll surface this opening to qualified professionals nearby.
        </p>
      </div>
    </header>

    <section class="px-6 pb-24 md:px-12">
      <div class="mx-auto max-w-3xl">
        <PostShiftForm />
      </div>
    </section>
  </div>
</template>
