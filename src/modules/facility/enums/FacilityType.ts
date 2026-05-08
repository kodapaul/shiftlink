/**
 * The kind of healthcare facility.
 * Stored as snake_case strings for stable serialization.
 */
export const FacilityType = {
  Hospital: 'hospital',
  AgedCare: 'aged_care',
  MentalHealth: 'mental_health',
  Clinic: 'clinic',
  CommunityHealth: 'community_health',
  Hospice: 'hospice',
} as const

export type FacilityType = (typeof FacilityType)[keyof typeof FacilityType]

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  [FacilityType.Hospital]: 'Hospital',
  [FacilityType.AgedCare]: 'Aged Care',
  [FacilityType.MentalHealth]: 'Mental Health',
  [FacilityType.Clinic]: 'Clinic',
  [FacilityType.CommunityHealth]: 'Community Health',
  [FacilityType.Hospice]: 'Hospice / Palliative',
}
