/**
 * Steps in the post-registration onboarding flow.
 *
 * Stored as snake_case for stable serialization (matches the pattern in
 * FacilityType / StaffPosition / etc.).
 */

export const OnboardingStep = {
  Welcome: 'welcome',
  Facility: 'facility',
  Invite: 'invite',
  Done: 'done',
} as const

export type OnboardingStep = (typeof OnboardingStep)[keyof typeof OnboardingStep]

export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  [OnboardingStep.Welcome]: 'Welcome',
  [OnboardingStep.Facility]: 'Facility info',
  [OnboardingStep.Invite]: 'Invite staff',
  [OnboardingStep.Done]: 'All set',
}

/** Ordered list — the wizard walks through these in sequence. */
export const ONBOARDING_STEP_ORDER: readonly OnboardingStep[] = [
  OnboardingStep.Welcome,
  OnboardingStep.Facility,
  OnboardingStep.Invite,
  OnboardingStep.Done,
] as const
