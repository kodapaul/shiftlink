/**
 * Clinical specialty / practice area for healthcare professionals.
 *
 * Used on the professional profile (multi-select) and later on the shift
 * board for filtering / matching. Stored as snake_case strings for stable
 * serialization, same convention as the rest of the project's enums.
 */

export const Specialty = {
  AcuteCare: 'acute_care',
  AgedCare: 'aged_care',
  Cardiac: 'cardiac',
  Community: 'community',
  Emergency: 'emergency',
  IntensiveCare: 'intensive_care',
  MentalHealth: 'mental_health',
  Maternity: 'maternity',
  MedicalSurgical: 'medical_surgical',
  Oncology: 'oncology',
  Paediatric: 'paediatric',
  Theatre: 'theatre',
} as const

export type Specialty = (typeof Specialty)[keyof typeof Specialty]

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  [Specialty.AcuteCare]: 'Acute Care',
  [Specialty.AgedCare]: 'Aged Care',
  [Specialty.Cardiac]: 'Cardiac',
  [Specialty.Community]: 'Community Health',
  [Specialty.Emergency]: 'Emergency',
  [Specialty.IntensiveCare]: 'Intensive Care',
  [Specialty.MentalHealth]: 'Mental Health',
  [Specialty.Maternity]: 'Maternity',
  [Specialty.MedicalSurgical]: 'Medical / Surgical',
  [Specialty.Oncology]: 'Oncology',
  [Specialty.Paediatric]: 'Paediatric',
  [Specialty.Theatre]: 'Theatre / Perioperative',
}
