/**
 * Professional roles — the kind of healthcare worker.
 * Stored as snake_case strings for stable serialization.
 */
export const Role = {
  RegisteredNurse: 'registered_nurse',
  EnrolledNurse: 'enrolled_nurse',
  AssistantInNursing: 'assistant_in_nursing',
  Carer: 'carer',
  Midwife: 'midwife',
} as const

export type Role = (typeof Role)[keyof typeof Role]

export const ROLE_LABELS: Record<Role, string> = {
  [Role.RegisteredNurse]: 'Registered Nurse',
  [Role.EnrolledNurse]: 'Enrolled Nurse',
  [Role.AssistantInNursing]: 'Assistant in Nursing',
  [Role.Carer]: 'Carer',
  [Role.Midwife]: 'Midwife',
}

export const ROLE_SHORT_LABELS: Record<Role, string> = {
  [Role.RegisteredNurse]: 'RN',
  [Role.EnrolledNurse]: 'EN',
  [Role.AssistantInNursing]: 'AIN',
  [Role.Carer]: 'Carer',
  [Role.Midwife]: 'Midwife',
}
