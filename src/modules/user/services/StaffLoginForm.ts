/**
 * Service layer for staff login.
 *
 * Pure functions only — no Vue runtime, no API calls. The mock submission
 * resolves a staff record by email; password is not checked beyond a length
 * guard because we have no real auth here. The composable wraps these with
 * reactive state.
 */

import type { FacilityStaff } from '@/modules/facility/types'
import type { StaffLoginFormErrors, StaffLoginFormValues } from '../types/StaffLoginForm'

/** Default form values — empty, idle. */
export function emptyStaffLoginForm(): StaffLoginFormValues {
  return { email: '', password: '' }
}

/**
 * Result of a mock login attempt. We use a discriminated union so the caller
 * can branch on `status` without sentinel-checking nullable fields.
 */
export type StaffLoginResult =
  | { status: 'success'; staff: FacilityStaff }
  | { status: 'error'; errors: StaffLoginFormErrors }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Field-level validation. Empty errors object means the values look valid. */
export function validateStaffLoginForm(values: StaffLoginFormValues): StaffLoginFormErrors {
  const errors: StaffLoginFormErrors = {}

  const email = values.email.trim()
  if (!email) errors.email = 'Enter your email'
  else if (!EMAIL_REGEX.test(email)) errors.email = 'That email looks invalid'

  if (!values.password) errors.password = 'Enter your password'
  else if (values.password.length < 6) errors.password = 'At least 6 characters'

  return errors
}

/**
 * Mock submission. Looks up the staff member by email against the seed +
 * any staff created at registration time. Returns a discriminated result so
 * the composable can either start a session or render an error banner.
 */
export function submitStaffLoginForm(
  values: StaffLoginFormValues,
  resolveStaff: (email: string) => FacilityStaff | undefined,
): StaffLoginResult {
  const fieldErrors = validateStaffLoginForm(values)
  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', errors: fieldErrors }
  }

  const staff = resolveStaff(values.email)
  if (!staff) {
    return {
      status: 'error',
      errors: { form: 'No facility account found for that email. Try one of the demo accounts below.' },
    }
  }

  return { status: 'success', staff }
}
