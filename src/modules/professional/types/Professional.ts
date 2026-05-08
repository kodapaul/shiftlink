import type { User } from '@/modules/user/types/User'
import type { Role } from '../enums/Role'

/**
 * A healthcare professional — the person who claims shifts.
 * Independent of any facility.
 */
export interface Professional extends User {
  /** Narrows the User discriminator. */
  type: 'professional'

  /** What kind of healthcare worker they are. */
  role: Role

  /** Free-text certifications (e.g., "AHPRA: NMW0001234567", "First Aid"). */
  certifications?: string[]

  yearsExperience?: number

  /** Postcodes or suburbs they prefer to work in. */
  preferredLocations?: string[]
}
