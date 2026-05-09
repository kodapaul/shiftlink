/**
 * Form types for the staff (facility-side) registration flow.
 *
 * Single-facility model: every account registered through the prototype is
 * automatically assigned to the one seeded facility. The form captures only
 * the staff fields + a mock password — the facility section in the UI is a
 * read-only info card, not an editable input.
 *
 * All form-time fields are strings; the service is responsible for casting
 * to enum values and building the final `FacilityStaff` shape.
 */

import type { StaffPosition } from '@/modules/facility/enums/StaffPosition'

export interface StaffRegistrationFormValues {
  // Staff info (the person signing up)
  staffName: string
  staffEmail: string
  staffPhone: string
  staffPosition: StaffPosition | ''

  // Credentials (mock — never hit a backend)
  password: string
  confirmPassword: string
}

export type StaffRegistrationFormErrors = Partial<
  Record<keyof StaffRegistrationFormValues, string>
> & {
  /** Banner-level error not tied to any single field. */
  form?: string
}

export type StaffRegistrationFormStatus = 'idle' | 'submitting' | 'error' | 'success'
