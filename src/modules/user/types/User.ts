import type { UserType } from '../enums/UserType'

/**
 * Base shape for any human user of ShiftLink.
 *
 * `type` is the discriminator — Professional narrows it to `'professional'`,
 * FacilityStaff narrows it to `'facility_staff'`. Combined with `AnyUser`,
 * this gives full discriminated-union narrowing at use sites.
 */
export interface User {
  id: string
  type: UserType
  email: string
  name: string
  phone?: string
  /** ISO 8601 timestamp of when the user was created. */
  createdAt: string
}
