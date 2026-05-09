<script setup lang="ts">
/**
 * Stepper UI — numbered pills with hairline connector.
 *
 * Pure presentational. Consumes the array shape exposed by `useOnboarding`.
 */
import { Check } from 'lucide-vue-next'
import type { OnboardingStep } from '../enums/OnboardingStep'

defineProps<{
  steps: ReadonlyArray<{
    step: OnboardingStep
    label: string
    active: boolean
    complete: boolean
    index: number
  }>
}>()
</script>

<template>
  <ol class="flex items-center gap-3 text-[13px]">
    <li
      v-for="(s, i) in steps"
      :key="s.step"
      class="flex items-center gap-3"
    >
      <div class="flex items-center gap-2">
        <span
          :class="[
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] font-medium transition-colors',
            s.active && 'border-ink bg-ink text-cream',
            s.complete && !s.active && 'border-sage bg-sage text-ink',
            !s.active && !s.complete && 'border-mist bg-bone text-ink/45',
          ]"
        >
          <Check v-if="s.complete && !s.active" class="h-3.5 w-3.5" />
          <template v-else>{{ s.index + 1 }}</template>
        </span>
        <span
          :class="[
            'whitespace-nowrap',
            s.active ? 'font-medium text-ink' : 'text-ink/55',
          ]"
        >
          {{ s.label }}
        </span>
      </div>
      <span
        v-if="i < steps.length - 1"
        class="h-px w-8 bg-mist"
        aria-hidden="true"
      />
    </li>
  </ol>
</template>
