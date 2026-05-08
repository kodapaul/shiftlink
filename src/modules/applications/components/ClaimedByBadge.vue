<script setup lang="ts">
import { computed } from 'vue'
import professionalsData from '@/data/professionals.json'
import type { Professional } from '@/modules/professional/types'
import { Check } from 'lucide-vue-next'

// Pill that names the professional who claimed a shift. Used wherever a
// claimed shift is rendered (dashboard cards, shift detail header, future
// professional "my claimed shifts" view). Looks up the name from the
// static professionals seed; falls back to a generic label if the id
// isn't found (shouldn't happen with seeded data but is robust).

const props = defineProps<{ professionalId: string }>()

const professionals = professionalsData as Professional[]

const professional = computed(() =>
  professionals.find((p) => p.id === props.professionalId) ?? null,
)

const displayName = computed(() => professional.value?.name ?? 'Unknown professional')
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full bg-marigold/30 px-2.5 py-1 text-[11px] font-medium text-ink"
    :title="`Claimed by ${displayName}`"
  >
    <Check class="h-3 w-3" />
    Claimed by {{ displayName }}
  </span>
</template>
