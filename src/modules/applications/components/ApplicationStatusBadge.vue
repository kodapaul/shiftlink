<script setup lang="ts">
import { computed } from 'vue'
import { ApplicationStatus } from '@/modules/applications/enums'

const props = defineProps<{ status: ApplicationStatus }>()

// Pill colors mirror BRAND.md: sage = active/open, marigold = action,
// mist on ink = settled/quiet, blush kept for shift urgency only.
const config = computed(() => {
  switch (props.status) {
    case ApplicationStatus.Accepted:
      return { label: 'Accepted', classes: 'bg-marigold/30 text-ink border border-marigold/50', dot: 'bg-marigold' }
    case ApplicationStatus.Declined:
      return { label: 'Declined', classes: 'bg-ink/8 text-ink/65 border border-ink/10', dot: 'bg-ink/35' }
    case ApplicationStatus.Pending:
    default:
      return { label: 'Pending', classes: 'bg-sage/45 text-ink border border-sage/70', dot: 'bg-forest' }
  }
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em]',
      config.classes,
    ]"
  >
    <span :class="['h-1.5 w-1.5 rounded-full', config.dot]" />
    {{ config.label }}
  </span>
</template>
