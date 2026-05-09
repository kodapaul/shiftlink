/**
 * Form types for the professional profile (the "Profile" tab on
 * `/professional`).
 *
 * Mirrors `Professional` but everything is a string-shaped form value while
 * editing. Multi-add string lists (`certifications`, `skills`,
 * `languages`, `preferredLocations`) and multi-selects (`specialties`,
 * `preferredShiftTypes`) stay typed because the controls in the form
 * own their own internal "draft" string state and append concrete entries
 * on submit.
 *
 * `wwcc` is split into two fields here so each can be validated
 * independently; the service composes them back into the
 * `WorkingWithChildrenCheck` shape on submit.
 */

import type { Role } from '../enums/Role'
import type { RightToWork } from '../enums/RightToWork'
import type { Specialty } from '../enums/Specialty'
import type { ShiftType } from '@/modules/shifts/enums'

export interface ProfessionalProfileFormValues {
  // Identity
  name: string
  phone: string
  /** YYYY-MM-DD */
  dateOfBirth: string
  rightToWork: RightToWork | ''
  languages: string[]

  // Professional
  role: Role
  /** Numeric string while editing. */
  yearsExperience: string
  ahpraNumber: string
  /** YYYY-MM-DD */
  lastClinicalPractice: string
  specialties: Specialty[]
  skills: string[]
  certifications: string[]

  // Compliance — WWCC split for independent validation
  wwccNumber: string
  /** YYYY-MM-DD */
  wwccExpiry: string

  // Preferences
  preferredLocations: string[]
  preferredShiftTypes: ShiftType[]
  /** YYYY-MM-DD */
  availableFrom: string

  // About
  bio: string
}

export type ProfessionalProfileFormErrors = Partial<
  Record<keyof ProfessionalProfileFormValues, string>
> & {
  /** Banner-level error not tied to any single field. */
  form?: string
}

export type ProfessionalProfileFormStatus =
  | 'idle'
  | 'submitting'
  | 'error'
  | 'success'

/**
 * Profile completeness — a derived view used by the badge. `requiredFilled`
 * counts the required fields the pro has populated (see service for the
 * required list); `requiredTotal` is the count of required fields applicable
 * to their role (AHPRA only counts for RN/EN/Midwife).
 *
 * Values are clamped: percentage is `requiredFilled / requiredTotal * 100`,
 * rounded to the nearest int. If `missing` is empty, the profile is complete
 * for the purposes of applying to shifts.
 */
export interface ProfessionalProfileCompleteness {
  percentage: number
  requiredFilled: number
  requiredTotal: number
  /** Field keys still missing — used by the badge to render a checklist. */
  missing: ReadonlyArray<keyof ProfessionalProfileFormValues>
  /** True when `missing.length === 0`. */
  isComplete: boolean
}
