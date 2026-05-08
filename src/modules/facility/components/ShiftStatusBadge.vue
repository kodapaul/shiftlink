<script setup lang="ts">
import { computed } from 'vue'
import { ShiftStatus } from '@/modules/shifts/enums'
import { Urgency } from '@/modules/shifts/enums'
import type { Shift } from '@/modules/shifts/types'

const props = defineProps<{ shift: Pick<Shift, 'status' | 'urgency'> }>()

/**
 * Pill colors:
 *  - urgent + open  → blush (pink) — calls attention
 *  - open           → sage (green) — calm available
 *  - claimed        → mist on ink (subdued, "done")
 */
const config = computed(() => {
  if (props.shift.status === ShiftStatus.Claimed) {
    return {
      label: 'Claimed',
      classes: 'bg-ink/8 text-ink/70 border border-ink/10',
      dot: 'bg-ink/40',
    }
  }
  if (props.shift.urgency === Urgency.Urgent) {
    return {
      label: 'Urgent · open',
      classes: 'bg-blush/55 text-ink border border-blush',
      dot: 'bg-ink',
    }
  }
  return {
    label: 'Open',
    classes: 'bg-sage/45 text-ink border border-sage/70',
    dot: 'bg-forest',
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
