import type { User } from '@/modules/user/types/User'
import type { StaffPosition } from '../enums/StaffPosition'

/**
 * A person who works at a Facility and manages shifts on its behalf.
 * Belongs to exactly one Facility (via facilityId).
 *
 * When a "facility signup" happens in this prototype, we create both a
 * Facility (the org) and a FacilityStaff (the person logging in).
 */
export interface FacilityStaff extends User {
  /** Narrows the User discriminator. */
  type: 'facility_staff'

  /** The Facility this staff member belongs to. */
  facilityId: string

  /** Their role within the facility — determines what they can do. */
  position: StaffPosition
}
