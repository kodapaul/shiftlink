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
