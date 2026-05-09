/**
 * Service layer for staff (facility-side) registration.
 *
 * Pure functions — no Vue runtime, no API calls. Validates form values and
 * builds the final `FacilityStaff` record that the auth store persists.
 *
 * Single-facility model: registered staff are always assigned to
 * `SINGLE_FACILITY_ID`. The form has no facility-info inputs; the UI shows
 * the assigned facility as a read-only info card.
 */

import facilitiesData from '@/data/facilities.json'
import { StaffPosition } from '@/modules/facility/enums/StaffPosition'
import { UserType } from '@/modules/user/enums/UserType'
import type { Facility, FacilityStaff } from '@/modules/facility/types'
import type {
  StaffRegistrationFormErrors,
  StaffRegistrationFormValues,
} from '../types/StaffRegistrationForm'

const facilities = facilitiesData as Facility[]

/**
 * The id every staff registration is bound to. Pulled from the seed data so
 * if the demo ever swaps facilities we don't have to update this constant.
 */
export const SINGLE_FACILITY_ID: string = facilities[0]?.id ?? 'fac_001'

/** Default form values — empty, ready to fill in. */
export function emptyStaffRegistrationForm(): StaffRegistrationFormValues {
  return {
    staffName: '',
    staffEmail: '',
    staffPhone: '',
    staffPosition: '',
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
export function validateStaffRegistrationForm(
  values: StaffRegistrationFormValues,
  existingEmails: ReadonlySet<string>,
): StaffRegistrationFormErrors {
  const errors: StaffRegistrationFormErrors = {}

  if (!values.staffName.trim()) errors.staffName = 'Enter your full name'

  const email = values.staffEmail.trim().toLowerCase()
  if (!email) {
    errors.staffEmail = 'Enter your work email'
  } else if (!EMAIL_REGEX.test(email)) {
    errors.staffEmail = 'That email looks invalid'
  } else if (existingEmails.has(email)) {
    errors.staffEmail = 'An account already exists for this email'
  }

  if (!values.staffPosition) errors.staffPosition = 'Pick your role'

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
 * Build a `FacilityStaff` record from form values + a generated id, bound to
 * the single seeded facility.
 */
export function buildStaffFromForm(
  values: StaffRegistrationFormValues,
  staffId: string,
): FacilityStaff {
  const phone = values.staffPhone.trim()
  return {
    id: staffId,
    type: UserType.FacilityStaff,
    facilityId: SINGLE_FACILITY_ID,
    name: values.staffName.trim(),
    email: values.staffEmail.trim().toLowerCase(),
    position: values.staffPosition as StaffPosition,
    createdAt: new Date().toISOString(),
    ...(phone ? { phone } : {}),
  }
}
