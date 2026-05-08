/**
 * What kind of user is logged in.
 *
 * Drives:
 *   • Auth state (`useAuthStore.userType`)
 *   • Route guards (which views a user can access)
 *   • Signup branching (`/signup?type=...`)
 *   • Entity discriminator on Professional.kind and FacilityStaff.kind
 *
 * Values match the entity discriminators exactly:
 *   Professional.kind === 'professional'
 *   FacilityStaff.kind === 'facility_staff'
 */
export const UserType = {
  Professional: 'professional',
  FacilityStaff: 'facility_staff',
} as const

export type UserType = (typeof UserType)[keyof typeof UserType]

export const USER_TYPE_LABELS: Record<UserType, string> = {
  [UserType.Professional]: 'Healthcare professional',
  [UserType.FacilityStaff]: 'Facility staff',
}
