<script setup lang="ts">
import { computed } from 'vue'
import { Users } from 'lucide-vue-next'

// Shows the number of pending applicants on a shift card.
// Marigold tint when there's at least one, muted when zero.
const props = withDefaults(
  defineProps<{
    count: number
    // Total apps including accepted/declined, used in the title attr.
    total?: number
  }>(),
  { total: 0 },
)

const hasApplicants = computed(() => props.count > 0)

const title = computed(() => {
  if (!hasApplicants.value) return 'No applicants yet'
  if (props.count === 1) return '1 pending applicant'
  return `${props.count} pending applicants`
})
</script>

<template>
  <span
    :title="title"
    :class="[
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums',
      hasApplicants
        ? 'bg-marigold/30 text-ink'
        : 'bg-mist/70 text-ink/55',
    ]"
  >
    <Users class="h-3 w-3" />
    {{ count }}
    {{ count === 1 ? 'applicant' : 'applicants' }}
  </span>
</template>
