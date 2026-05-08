import type { ShiftStatus, Urgency, ShiftType } from '../enums'

/**
 * A shift posted by the facility, available for a Professional to claim.
 *
 * Lifecycle:
 *   - Created with status === 'open'
 *   - When a professional claims it, status flips to 'claimed' and
 *     claimedByProfessionalId / claimedAt are populated.
 *
 * Ownership:
 *   This prototype models a single facility. Every shift implicitly belongs
 *   to that facility, so there's no facilityId on a shift — the only owner
 *   reference we keep is `postedByStaffId` (which staff member created it).
 */
export interface Shift {
  id: string

  /** Which staff member posted this shift — references FacilityStaff.id. */
  postedByStaffId: string

  /**
   * What kind of healthcare worker is needed.
   *
   * Free-text — facilities often need very specific titles ("Mental Health
   * RN with PRN experience", "Pediatric ICU RN") that don't fit a fixed
   * enum. The display layer trusts whatever the facility typed.
   */
  role: string

  /** Local date in 'YYYY-MM-DD' format (no timezone — facility-local). */
  date: string

  /** 'HH:mm' 24-hour. */
  startTime: string

  /** 'HH:mm' 24-hour. May be earlier than startTime when the shift crosses midnight (night shift). */
  endTime: string

  /** Hourly rate in AUD. */
  hourlyRate: number

  /**
   * Optional per-shift location — e.g. "ICU, Building B" or "Acute Ward,
   * Level 3". Lets a multi-site facility tell professionals where exactly
   * to show up. Falls back to the parent Facility's `location` for display
   * when omitted.
   */
  location?: string

  /**
   * Optional latitude / longitude of the shift's physical address. Lives on
   * the shift (not the facility) because a single facility can post shifts
   * at different sites. Used by future "shifts near me" / map features.
   */
  lat?: number
  lng?: number

  /** Time-of-day classification — derived from startTime/endTime but stored for fast filtering. */
  shiftType: ShiftType

  status: ShiftStatus
  urgency: Urgency

  /** Optional free-text notes from the facility (e.g., "Bring scrubs", "Familiar with PRN meds"). */
  notes?: string

  /** ISO 8601 timestamp of when the shift was posted. */
  createdAt: string

  /** Set when status === 'claimed' — references Professional.id. */
  claimedByProfessionalId?: string

  /** Set when status === 'claimed' — ISO 8601 timestamp of when the claim happened. */
  claimedAt?: string
}
