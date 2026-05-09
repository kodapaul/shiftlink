/**
 * Service layer for the "post a shift" form.
 *
 * Pure functions — no Vue runtime imports, no reactivity, no API calls.
 * The composable wraps these with reactive state.
 */

import type { PostShiftFormValues, PostShiftFormErrors } from '../types/PostShiftForm'
import { ShiftType, Urgency } from '@/modules/shifts/enums'
import type { Shift } from '@/modules/shifts/types'

/** Default form values — empty, idle, ready for the user to fill in. */
export function emptyPostShiftForm(): PostShiftFormValues {
  return {
    role: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    hourlyRate: '',
    urgency: Urgency.Standard,
    notes: '',
  }
}

/** Validate the form values. Returns an errors object — empty means valid. */
export function validatePostShiftForm(values: PostShiftFormValues): PostShiftFormErrors {
  const errors: PostShiftFormErrors = {}

  if (!values.role.trim()) errors.role = 'Enter a role'
  else if (values.role.trim().length < 2) errors.role = 'Role looks too short'

  if (!values.date) {
    errors.date = 'Pick a date'
  } else {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const picked = new Date(values.date + 'T00:00:00')
    if (picked < today) errors.date = 'Pick today or a future date'
  }

  if (!values.startTime) errors.startTime = 'Required'
  if (!values.endTime) errors.endTime = 'Required'

  if (!values.hourlyRate) {
    errors.hourlyRate = 'Required'
  } else {
    const rate = Number(values.hourlyRate)
    if (Number.isNaN(rate) || rate <= 0) errors.hourlyRate = 'Must be a positive number'
    else if (rate < 20) errors.hourlyRate = 'Below minimum award rate'
    else if (rate > 200) errors.hourlyRate = 'Are you sure? That rate looks unusually high'
  }

  return errors
}

/**
 * Classify a shift by its start time. Used to populate the `shiftType` field
 * on `Shift` so the dashboard cards / filters can group shifts by time-of-day
 * without asking the user to enter it twice.
 *
 *   05:00 – 13:59  → day
 *   14:00 – 21:59  → evening
 *   22:00 – 04:59  → night
 */
export function deriveShiftType(startTime: string): ShiftType {
  const hour = Number(startTime.split(':')[0])
  if (Number.isNaN(hour)) return ShiftType.Day
  if (hour >= 5 && hour <= 13) return ShiftType.Day
  if (hour >= 14 && hour <= 21) return ShiftType.Evening
  return ShiftType.Night
}

/** Build a Shift draft (without id/createdAt/status — the store fills those in). */
export function buildShiftDraft(
  values: PostShiftFormValues,
  postedByStaffId: string,
): Omit<Shift, 'id' | 'createdAt' | 'status'> {
  return {
    postedByStaffId,
    role: values.role.trim(),
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    hourlyRate: Number(values.hourlyRate),
    shiftType: deriveShiftType(values.startTime),
    urgency: values.urgency,
    location: values.location.trim() || undefined,
    notes: values.notes.trim() || undefined,
  }
}

/**
 * Sydney metro suburb centroids used to place new shifts on the map.
 * Mirrors the seed-shift generator (scripts/generate-shifts.mjs) so the
 * pin density across the city looks consistent between seeded shifts and
 * shifts created at runtime through the post-shift form.
 *
 * In a real app, geocoding the `location` string (e.g. via Mapbox /
 * Nominatim) would replace this random pick — for the prototype, scattering
 * across known Sydney points is enough.
 */
const SYDNEY_SUBURBS: ReadonlyArray<{ lat: number; lng: number }> = [
  { lat: -33.8915, lng: 151.2767 }, // Bondi
  { lat: -33.8225, lng: 151.1947 }, // St Leonards
  { lat: -33.8853, lng: 151.2117 }, // Surry Hills
  { lat: -34.0563, lng: 151.1525 }, // Cronulla
  { lat: -33.7969, lng: 151.2839 }, // Manly
  { lat: -33.8688, lng: 151.2093 }, // Sydney CBD
  { lat: -33.8915, lng: 151.1782 }, // Marrickville
  { lat: -33.8166, lng: 151.0024 }, // Parramatta
  { lat: -33.7688, lng: 151.2531 }, // Mosman
  { lat: -33.9173, lng: 151.0991 }, // Bankstown
]

/**
 * Pick a random suburb centroid and add ±0.005° jitter so multiple shifts
 * in the same area don't stack on the map. Returns 6-decimal-place values
 * to match the seed data's precision.
 *
 * Used by the create branch of the post-shift form. Edit mode preserves
 * the existing shift's coords; this helper is not called during edit.
 */
export function randomSydneyCoords(): { lat: number; lng: number } {
  const base =
    SYDNEY_SUBURBS[Math.floor(Math.random() * SYDNEY_SUBURBS.length)]!
  // Jitter range: ±0.005° (~500m), same as the seed generator.
  const jitter = () => (Math.random() - 0.5) * 0.01
  return {
    lat: +(base.lat + jitter()).toFixed(6),
    lng: +(base.lng + jitter()).toFixed(6),
  }
}
