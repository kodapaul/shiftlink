/**
 * The lifecycle state of a posted shift.
 */
export const ShiftStatus = {
  Open: 'open',
  Claimed: 'claimed',
} as const

export type ShiftStatus = (typeof ShiftStatus)[keyof typeof ShiftStatus]

export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  [ShiftStatus.Open]: 'Open',
  [ShiftStatus.Claimed]: 'Claimed',
}
