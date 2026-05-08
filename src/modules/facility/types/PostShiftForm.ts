import type { Urgency } from '@/modules/shifts/enums'

/**
 * Form values for the "post a shift" form.
 *
 * All strings while editing — the service is responsible for casting to the
 * `Shift` shape (numeric rate, ISO timestamps, etc.).
 *
 * Note: `shiftType` is derived from `startTime` at submit time, not collected
 * from the user. See `services/PostShiftForm.ts#deriveShiftType`.
 */
export interface PostShiftFormValues {
  /** Free-text role / job title (e.g. "Registered Nurse — Acute Care"). */
  role: string
  /** Optional free-text per-shift location (e.g. "ICU, Building B"). */
  location: string
  /** YYYY-MM-DD */
  date: string
  /** HH:mm */
  startTime: string
  /** HH:mm */
  endTime: string
  /** Numeric string while editing. */
  hourlyRate: string
  urgency: Urgency
  notes: string
}

export type PostShiftFormErrors = Partial<Record<keyof PostShiftFormValues, string>>

export type PostShiftFormStatus = 'idle' | 'submitting' | 'error' | 'success'
