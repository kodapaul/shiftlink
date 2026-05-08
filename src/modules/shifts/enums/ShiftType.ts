/**
 * Time-of-day classification for a shift.
 * Used as a quick visual tag and as a filter axis on the shift board.
 *
 * Conventions used by the generator:
 *   Day      07:00 – 15:00
 *   Evening  15:00 – 23:00
 *   Night    23:00 – 07:00 (crosses midnight)
 */
export const ShiftType = {
  Day: 'day',
  Evening: 'evening',
  Night: 'night',
} as const

export type ShiftType = (typeof ShiftType)[keyof typeof ShiftType]

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  [ShiftType.Day]: 'Day shift',
  [ShiftType.Evening]: 'Evening shift',
  [ShiftType.Night]: 'Night shift',
}
