/**
 * Service layer for the professional profile form.
 *
 * Pure functions — no Vue runtime, no API calls. The composable wraps these
 * with reactive state and calls into them on submit.
 *
 * Three responsibilities:
 *   1. `emptyProfessionalProfileForm` / `populateProfessionalProfileForm` —
 *      shape the form values (initial + when hydrating from a saved record).
 *   2. `validateProfessionalProfileForm` — field-level validation; returns
 *      an errors object scoped to the form.
 *   3. `computeProfileCompleteness` / `buildProfilePatchFromForm` — derive
 *      the "% complete" view used by the UI badge, and translate validated
 *      form values into a `Partial<Professional>` patch suitable for
 *      `useAuthStore.updateProfessionalProfile`.
 */

import { Role } from '../enums/Role'
import type {
  Professional,
  ProfessionalProfileCompleteness,
  ProfessionalProfileFormErrors,
  ProfessionalProfileFormValues,
  WorkingWithChildrenCheck,
} from '../types'
import { RightToWork } from '../enums/RightToWork'

/** Empty / initial form values. Used for "I haven't filled anything in yet". */
export function emptyProfessionalProfileForm(): ProfessionalProfileFormValues {
  return {
    name: '',
    phone: '',
    dateOfBirth: '',
    rightToWork: '',
    languages: [],

    role: Role.RegisteredNurse,
    yearsExperience: '',
    ahpraNumber: '',
    lastClinicalPractice: '',
    specialties: [],
    skills: [],
    certifications: [],

    wwccNumber: '',
    wwccExpiry: '',

    preferredLocations: [],
    preferredShiftTypes: [],
    availableFrom: '',

    bio: '',
  }
}

/**
 * Hydrate the form values from a `Professional` record. Used when entering
 * edit mode so the form starts populated with the user's saved values.
 */
export function populateProfessionalProfileForm(
  pro: Professional,
): ProfessionalProfileFormValues {
  return {
    name: pro.name,
    phone: pro.phone ?? '',
    dateOfBirth: pro.dateOfBirth ?? '',
    rightToWork: pro.rightToWork ?? '',
    languages: pro.languages ? [...pro.languages] : [],

    role: pro.role,
    yearsExperience:
      pro.yearsExperience !== undefined ? String(pro.yearsExperience) : '',
    ahpraNumber: pro.ahpraNumber ?? '',
    lastClinicalPractice: pro.lastClinicalPractice ?? '',
    specialties: pro.specialties ? [...pro.specialties] : [],
    skills: pro.skills ? [...pro.skills] : [],
    certifications: pro.certifications ? [...pro.certifications] : [],

    wwccNumber: pro.wwcc?.number ?? '',
    wwccExpiry: pro.wwcc?.expiry ?? '',

    preferredLocations: pro.preferredLocations ? [...pro.preferredLocations] : [],
    preferredShiftTypes: pro.preferredShiftTypes ? [...pro.preferredShiftTypes] : [],
    availableFrom: pro.availableFrom ?? '',

    bio: pro.bio ?? '',
  }
}

/** Roles that require an AHPRA registration number. AINs and Carers don't. */
export function roleRequiresAhpra(role: Role): boolean {
  return (
    role === Role.RegisteredNurse ||
    role === Role.EnrolledNurse ||
    role === Role.Midwife
  )
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isFutureOrTodayISO(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const picked = new Date(value + 'T00:00:00')
  return picked.getTime() >= today.getTime()
}

function isPastOrTodayISO(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const picked = new Date(value + 'T00:00:00')
  return picked.getTime() <= today.getTime()
}

/**
 * Validate the form. Returns an errors object — empty means valid.
 *
 * Note this is a *full* validation pass: even soft / recommended fields
 * are checked for shape (e.g. valid ISO date), so the user gets feedback if
 * they've typed something the parser couldn't make sense of. Whether a
 * field is required is a different question — see `computeProfileCompleteness`.
 */
export function validateProfessionalProfileForm(
  values: ProfessionalProfileFormValues,
): ProfessionalProfileFormErrors {
  const errors: ProfessionalProfileFormErrors = {}

  // Identity
  if (!values.name.trim()) errors.name = 'Enter your full name'

  if (values.phone && values.phone.replace(/\D/g, '').length < 6) {
    errors.phone = "That doesn't look like a phone number"
  }

  if (values.dateOfBirth) {
    if (!ISO_DATE.test(values.dateOfBirth)) {
      errors.dateOfBirth = 'Use the date picker'
    } else if (!isPastOrTodayISO(values.dateOfBirth)) {
      errors.dateOfBirth = 'Date of birth must be in the past'
    }
  }

  if (values.rightToWork) {
    const allowed: ReadonlySet<string> = new Set(Object.values(RightToWork))
    if (!allowed.has(values.rightToWork)) {
      errors.rightToWork = 'Pick one of the listed options'
    }
  }

  // Professional
  if (values.yearsExperience) {
    const years = Number(values.yearsExperience)
    if (Number.isNaN(years) || years < 0) {
      errors.yearsExperience = 'Must be 0 or more'
    } else if (years > 60) {
      errors.yearsExperience = "That's a lot — double-check?"
    }
  }

  if (roleRequiresAhpra(values.role) && values.ahpraNumber) {
    // AHPRA numbers are alphanumeric, ~10–13 chars — loose check only.
    if (!/^[A-Za-z0-9: -]{6,32}$/.test(values.ahpraNumber.trim())) {
      errors.ahpraNumber = 'AHPRA numbers look like "NMW0001234567"'
    }
  }

  if (values.lastClinicalPractice) {
    if (!ISO_DATE.test(values.lastClinicalPractice)) {
      errors.lastClinicalPractice = 'Use the date picker'
    } else if (!isPastOrTodayISO(values.lastClinicalPractice)) {
      errors.lastClinicalPractice = "Can't be in the future"
    }
  }

  // Compliance — WWCC: if either field is set, require both.
  if (values.wwccNumber || values.wwccExpiry) {
    if (!values.wwccNumber.trim()) {
      errors.wwccNumber = 'Enter your WWCC number'
    }
    if (!values.wwccExpiry) {
      errors.wwccExpiry = 'Pick the expiry date'
    } else if (!ISO_DATE.test(values.wwccExpiry)) {
      errors.wwccExpiry = 'Use the date picker'
    }
  }

  // Preferences
  if (values.availableFrom && !ISO_DATE.test(values.availableFrom)) {
    errors.availableFrom = 'Use the date picker'
  } else if (values.availableFrom && !isFutureOrTodayISO(values.availableFrom)) {
    errors.availableFrom = "Can't be in the past"
  }

  // About
  if (values.bio.trim().length > 280) {
    errors.bio = 'Keep it under 280 characters'
  }

  return errors
}

/**
 * The required-for-applying field set, parameterised by role (so AHPRA only
 * counts when the role requires it). Order matches how the form sections
 * read top-to-bottom; the badge surfaces these in the same order.
 */
function requiredFieldsFor(role: Role): ReadonlyArray<keyof ProfessionalProfileFormValues> {
  const base: Array<keyof ProfessionalProfileFormValues> = [
    'name',
    'phone',
    'dateOfBirth',
    'rightToWork',
    'yearsExperience',
    'lastClinicalPractice',
    'specialties',
    'wwccNumber',
    'wwccExpiry',
    'preferredLocations',
    'bio',
  ]
  if (roleRequiresAhpra(role)) {
    // Slot AHPRA right after years of experience — that's where it lives in
    // the form too, so the "missing" list matches the visual order.
    base.splice(5, 0, 'ahpraNumber')
  }
  return base
}

/** A field counts as "filled" when its value is truthy and non-empty. */
function isFieldFilled(
  values: ProfessionalProfileFormValues,
  key: keyof ProfessionalProfileFormValues,
): boolean {
  const v = values[key]
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'string') return v.trim().length > 0
  return Boolean(v)
}

/**
 * Derive the completeness view from form values. Used by the badge — does
 * not perform format validation (use `validateProfessionalProfileForm` for
 * that). A profile can be 100% complete and still have a typo'd date that
 * fails validation; the badge only cares about presence.
 */
export function computeProfileCompleteness(
  values: ProfessionalProfileFormValues,
): ProfessionalProfileCompleteness {
  const required = requiredFieldsFor(values.role)
  const missing = required.filter((key) => !isFieldFilled(values, key))
  const requiredFilled = required.length - missing.length
  const requiredTotal = required.length
  const percentage =
    requiredTotal === 0 ? 100 : Math.round((requiredFilled / requiredTotal) * 100)

  return {
    percentage,
    requiredFilled,
    requiredTotal,
    missing,
    isComplete: missing.length === 0,
  }
}

/**
 * Build a `Partial<Professional>` patch from validated form values. Used by
 * the composable on submit; what we get back is suitable for
 * `useAuthStore.updateProfessionalProfile(patch)`.
 *
 * Empty values are mapped to `undefined` so they clear (rather than persist
 * empty strings / empty arrays). The `wwcc` object is composed from the two
 * split form fields.
 */
export function buildProfilePatchFromForm(
  values: ProfessionalProfileFormValues,
): Partial<Professional> {
  const trimmedString = (s: string): string | undefined => {
    const t = s.trim()
    return t.length > 0 ? t : undefined
  }
  const stringList = (arr: string[]): string[] | undefined => {
    const cleaned = arr.map((s) => s.trim()).filter((s) => s.length > 0)
    return cleaned.length > 0 ? cleaned : undefined
  }
  const enumList = <T>(arr: T[]): T[] | undefined =>
    arr.length > 0 ? [...arr] : undefined

  const wwcc: WorkingWithChildrenCheck | undefined =
    values.wwccNumber.trim() && values.wwccExpiry
      ? { number: values.wwccNumber.trim(), expiry: values.wwccExpiry }
      : undefined

  const yearsExperience = values.yearsExperience
    ? Number(values.yearsExperience)
    : undefined

  return {
    name: values.name.trim(),
    phone: trimmedString(values.phone),
    dateOfBirth: trimmedString(values.dateOfBirth),
    rightToWork: values.rightToWork || undefined,
    languages: stringList(values.languages),

    role: values.role,
    yearsExperience: Number.isFinite(yearsExperience) ? yearsExperience : undefined,
    ahpraNumber: roleRequiresAhpra(values.role)
      ? trimmedString(values.ahpraNumber)
      : undefined,
    lastClinicalPractice: trimmedString(values.lastClinicalPractice),
    specialties: enumList(values.specialties),
    skills: stringList(values.skills),
    certifications: stringList(values.certifications),

    wwcc,

    preferredLocations: stringList(values.preferredLocations),
    preferredShiftTypes: enumList(values.preferredShiftTypes),
    availableFrom: trimmedString(values.availableFrom),

    bio: trimmedString(values.bio),
  }
}
