/**
 * Composable: step state machine for the post-registration onboarding flow.
 *
 * Keeps track of the current step, exposes guards for "can advance / go back",
 * and exposes the labelled step list (for a stepper UI). Marking onboarding
 * complete delegates to the auth store so the flag is persisted.
 */

import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  ONBOARDING_STEP_LABELS,
  ONBOARDING_STEP_ORDER,
  OnboardingStep,
} from '../enums/OnboardingStep'

export function useOnboarding() {
  const auth = useAuthStore()

  const current = ref<OnboardingStep>(OnboardingStep.Welcome)

  const currentIndex = computed<number>(() => ONBOARDING_STEP_ORDER.indexOf(current.value))

  const isFirst = computed<boolean>(() => currentIndex.value === 0)
  const isLast = computed<boolean>(
    () => currentIndex.value === ONBOARDING_STEP_ORDER.length - 1,
  )

  const steps = computed(() =>
    ONBOARDING_STEP_ORDER.map((step, index) => ({
      step,
      label: ONBOARDING_STEP_LABELS[step],
      active: step === current.value,
      complete: index < currentIndex.value,
      index,
    })),
  )

  function next(): void {
    if (isLast.value) return
    current.value = ONBOARDING_STEP_ORDER[currentIndex.value + 1]!
  }

  function back(): void {
    if (isFirst.value) return
    current.value = ONBOARDING_STEP_ORDER[currentIndex.value - 1]!
  }

  function goTo(step: OnboardingStep): void {
    current.value = step
  }

  /**
   * Mark the active staff member's onboarding as complete (idempotent).
   * Caller is expected to route to the dashboard immediately afterwards.
   */
  function complete(): void {
    if (auth.userId) auth.markOnboardingComplete(auth.userId)
  }

  return {
    current,
    currentIndex,
    isFirst,
    isLast,
    steps,
    next,
    back,
    goTo,
    complete,
  }
}
