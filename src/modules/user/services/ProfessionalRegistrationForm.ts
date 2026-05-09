/**
 * Service layer for professional registration.
 *
 * Pure functions — no Vue runtime, no API calls. Validates form values and
 * builds the final `Professional` record that the auth store persists. Id
 * generation is delegated to the auth store so a single caller controls the
 * namespace.
 */

import { Role } from '@/modules/professional/enums/Role'
import { UserType } from '@/modules/user/enums/UserType'
import type { Professional } from '@/modules/professional/types'
import type {
  ProfessionalRegistrationFormErrors,
  ProfessionalRegistrationFormValues,
} from '../types/ProfessionalRegistrationForm'

/** Default form values — empty, ready to fill in. */
export function emptyProfessionalRegistrationForm(): ProfessionalRegistrationFormValues {
  return {
    name: '',
    email: '',
    phone: '',
    role: '',
    yearsExperience: '',
    password: '',
    confirmPassword: '',
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate the registration form. Returns an errors object keyed by field
 * name. Empty object means the form is valid.
 *
 * `existingEmails` is the set of emails already in use (seed + any prior
 * registrations); we reject duplicates so login lookup stays unambiguous.
 */
export function validateProfessionalRegistrationForm(
  values: ProfessionalRegistrationFormValues,
  existingEmails: ReadonlySet<string>,
): ProfessionalRegistrationFormErrors {
  const errors: ProfessionalRegistrationFormErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Enter your full name'
  } else if (values.name.trim().length < 2) {
    errors.name = 'That name looks too short'
  }

  const email = values.email.trim().toLowerCase()
  if (!email) {
    errors.email = 'Enter your email'
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'That email looks invalid'
  } else if (existingEmails.has(email)) {
    errors.email = 'An account already exists for this email'
  }

  if (!values.role) errors.role = 'Pick your role'

  if (!values.yearsExperience) {
    errors.yearsExperience = 'Required'
  } else {
    const years = Number(values.yearsExperience)
    if (Number.isNaN(years) || years < 0) {
      errors.yearsExperience = 'Must be 0 or more'
    } else if (years > 60) {
      errors.yearsExperience = "That's a lot — double-check?"
    }
  }

  if (!values.password) {
    errors.password = 'Choose a password'
  } else if (values.password.length < 6) {
    errors.password = 'At least 6 characters'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password'
  } else if (values.password && values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords don't match"
  }

  return errors
}

/**
 * Build a `Professional` record from form values + a generated id.
 * The form's `role` is narrowed to `Role` because the caller has already
 * validated the form (so the empty-string variant is impossible here).
 */
export function buildProfessionalFromForm(
  values: ProfessionalRegistrationFormValues,
  professionalId: string,
): Professional {
  const phone = values.phone.trim()
  return {
    id: professionalId,
    type: UserType.Professional,
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    role: values.role as Role,
    yearsExperience: Number(values.yearsExperience),
    createdAt: new Date().toISOString(),
    ...(phone ? { phone } : {}),
  }
}
