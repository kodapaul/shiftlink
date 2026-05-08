/**
 * The position a FacilityStaff member holds at their facility.
 * Determines what they're authorised to do (post shifts, manage roster, etc.).
 * Stored as snake_case strings for stable serialization.
 */
export const StaffPosition = {
  NurseManager: 'nurse_manager',
  ChargeNurse: 'charge_nurse',
  RosterCoordinator: 'roster_coordinator',
  HRStaff: 'hr_staff',
  Administrator: 'administrator',
} as const

export type StaffPosition = (typeof StaffPosition)[keyof typeof StaffPosition]

export const STAFF_POSITION_LABELS: Record<StaffPosition, string> = {
  [StaffPosition.NurseManager]: 'Nurse Manager',
  [StaffPosition.ChargeNurse]: 'Charge Nurse',
  [StaffPosition.RosterCoordinator]: 'Roster Coordinator',
  [StaffPosition.HRStaff]: 'HR / Recruitment',
  [StaffPosition.Administrator]: 'Administrator',
}
