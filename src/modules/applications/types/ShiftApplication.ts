import type { ApplicationStatus } from '../enums/ApplicationStatus'

/**
 * A professional's application to a posted shift.
 *
 * Lifecycle:
 *   pending  -> the professional applied, facility hasn't acted yet
 *   accepted -> facility staff accepted; the related Shift becomes 'claimed'
 *   declined -> facility staff declined this applicant
 *
 * A shift can have many applications; at most one should end up accepted.
 * Other applications for the same shift can be auto-declined when one is
 * accepted, but that's a UI/store concern, not a type concern.
 */
export interface ShiftApplication {
  id: string

  // References Shift.id.
  shiftId: string

  // References Professional.id.
  professionalId: string

  status: ApplicationStatus

  // ISO timestamp when the professional submitted the application.
  appliedAt: string

  // Optional cover note from the applicant.
  message?: string

  // Set when the application is accepted or declined.
  decidedAt?: string
  decidedByStaffId?: string
}
