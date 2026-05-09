/**
 * Form types for professional registration.
 *
 * The form captures the minimum fields needed to build a `Professional`
 * record: identity (name / email / phone), professional context (role +
 * years of experience), and a mock password. Certifications and preferred
 * locations are not collected here — they'd live in a profile-edit screen
 * later.
 *
 * All form-time fields are strings; the service casts to the right shape
 * (numeric `yearsExperience`, narrowed `role` enum) at submit time.
 */

import type { Role } from '@/modules/professional/enums/Role'

export interface ProfessionalRegistrationFormValues {
  name: string
  email: string
  phone: string
  role: Role | ''
  /** Numeric string while editing; the service casts to a number. */
  yearsExperience: string
  password: string
  confirmPassword: string
}

export type ProfessionalRegistrationFormErrors = Partial<
  Record<keyof ProfessionalRegistrationFormValues, string>
> & {
  /** Banner-level error not tied to any single field. */
  form?: string
}

export type ProfessionalRegistrationFormStatus =
  | 'idle'
  | 'submitting'
  | 'error'
  | 'success'
