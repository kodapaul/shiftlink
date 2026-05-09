import type { User } from '@/modules/user/types/User'
import type { Role } from '../enums/Role'
import type { RightToWork } from '../enums/RightToWork'
import type { Specialty } from '../enums/Specialty'
import type { ShiftType } from '@/modules/shifts/enums'

/**
 * Working With Children Check — required for most healthcare contexts in NSW.
 * The shape stays simple: the card number a facility can verify against the
 * Service NSW register, and the expiry date the prototype uses to surface a
 * "WWCC expired" or "expiring soon" warning on the profile.
 */
export interface WorkingWithChildrenCheck {
  number: string
  /** YYYY-MM-DD */
  expiry: string
}

/**
 * A healthcare professional — the person who claims shifts.
 * Independent of any facility.
 *
 * The base identity fields (id, type, email, name, phone, createdAt) come
 * from `User`. Everything else groups loosely as:
 *   - Professional / clinical:  role, ahpraNumber, yearsExperience,
 *     lastClinicalPractice, specialties, skills, certifications
 *   - Compliance:               wwcc, rightToWork, dateOfBirth
 *   - Preferences:              preferredLocations, preferredShiftTypes,
 *                               availableFrom
 *   - Soft profile:             bio, languages
 *
 * All profile-fill fields are optional on the type — completeness is a
 * runtime check (see `services/ProfessionalProfileForm.ts`). New
 * registrations come in with the registration-form fields populated and
 * everything else blank; the user fills the rest via the Profile tab.
 */
export interface Professional extends User {
  /** Narrows the User discriminator. */
  type: 'professional'

  // --- Professional / clinical
  /** What kind of healthcare worker they are. */
  role: Role
  /** AHPRA registration number. Required for RN / EN / Midwife in AU. */
  ahpraNumber?: string
  yearsExperience?: number
  /** YYYY-MM-DD — when they last worked clinically. Used as a currency check. */
  lastClinicalPractice?: string
  /** Multi-select clinical specialties / practice areas. */
  specialties?: Specialty[]
  /** Free-text granular competencies (e.g., "IV cannulation", "ECG"). */
  skills?: string[]
  /** Free-text certifications (e.g., "AHPRA: NMW0001234567", "First Aid"). */
  certifications?: string[]

  // --- Compliance
  /** Working With Children Check — number + expiry. */
  wwcc?: WorkingWithChildrenCheck
  /** Right to work in Australia. */
  rightToWork?: RightToWork
  /** YYYY-MM-DD. Stored, not displayed to facilities — internal only. */
  dateOfBirth?: string

  // --- Preferences
  /** Postcodes or suburbs they prefer to work in. */
  preferredLocations?: string[]
  /** Preferred shift times (day / evening / night). Reuses `ShiftType`. */
  preferredShiftTypes?: ShiftType[]
  /** YYYY-MM-DD — earliest date they'll accept a shift. */
  availableFrom?: string

  // --- Soft profile
  /** ~200 char short intro. The pitch facilities read first. */
  bio?: string
  /** Free-text languages spoken. Useful in multicultural Sydney facilities. */
  languages?: string[]
}
