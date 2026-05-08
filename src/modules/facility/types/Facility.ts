import type { FacilityType } from '../enums/FacilityType'

/**
 * A healthcare facility — the organisation that posts shifts.
 * Examples: hospitals, aged care homes, clinics, mental health units.
 *
 * A Facility has many FacilityStaff. Shifts are posted by a Facility (via
 * facilityId) so they survive staff turnover.
 */
export interface Facility {
  id: string

  /** Display name (e.g., "St. Vincent's Aged Care — Bondi"). */
  name: string

  type: FacilityType

  /** Free-text suburb / city for this prototype (e.g., "Bondi, NSW"). */
  location: string

  phone?: string

  email?: string

  /** ISO 8601 timestamp of when the facility was registered. */
  createdAt: string
}
