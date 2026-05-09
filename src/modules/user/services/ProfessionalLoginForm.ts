/**
 * Service layer for professional login.
 *
 * Pure functions only — no Vue runtime, no API calls. The mock submission
 * resolves a professional record by email; password is not checked beyond a
 * length guard because we have no real auth here. The composable wraps these
 * with reactive state.
 */

import type { Professional } from '@/modules/professional/types'
import type {
  ProfessionalLoginFormErrors,
  ProfessionalLoginFormValues,
} from '../types/ProfessionalLoginForm'

/** Default form values — empty, idle. */
export function emptyProfessionalLoginForm(): ProfessionalLoginFormValues {
  return { email: '', password: '' }
}

/**
 * Result of a mock login attempt. We use a discriminated union so the caller
 * can branch on `status` without sentinel-checking nullable fields.
 */
export type ProfessionalLoginResult =
  | { status: 'success'; professional: Professional }
  | { status: 'error'; errors: ProfessionalLoginFormErrors }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Field-level validation. Empty errors object means the values look valid. */
export function validateProfessionalLoginForm(
  values: ProfessionalLoginFormValues,
): ProfessionalLoginFormErrors {
  const errors: ProfessionalLoginFormErrors = {}

  const email = values.email.trim()
  if (!email) errors.email = 'Enter your email'
  else if (!EMAIL_REGEX.test(email)) errors.email = 'That email looks invalid'

  if (!values.password) errors.password = 'Enter your password'
  else if (values.password.length < 6) errors.password = 'At least 6 characters'

  return errors
}

/**
 * Mock submission. Looks up the professional by email against the seed +
 * any professionals created at registration time. Returns a discriminated
 * result so the composable can either start a session or render an error
 * banner.
 */
export function submitProfessionalLoginForm(
  values: ProfessionalLoginFormValues,
  resolveProfessional: (email: string) => Professional | undefined,
): ProfessionalLoginResult {
  const fieldErrors = validateProfessionalLoginForm(values)
  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', errors: fieldErrors }
  }

  const professional = resolveProfessional(values.email)
  if (!professional) {
    return {
      status: 'error',
      errors: { form: 'No professional account found for that email. Try one of the demo accounts below.' },
    }
  }

  return { status: 'success', professional }
}
