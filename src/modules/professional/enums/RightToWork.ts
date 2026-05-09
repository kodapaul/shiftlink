/**
 * The professional's legal right to work in Australia. A standard
 * pre-shift compliance question every healthcare facility asks.
 *
 * `VisaHolder` covers the bulk of work-rights visas (482, 485, 491,
 * working holiday, etc.) without making us model each subclass — facilities
 * can follow up directly if they need the specifics.
 */

export const RightToWork = {
  Citizen: 'citizen',
  PermanentResident: 'permanent_resident',
  VisaHolder: 'visa_holder',
} as const

export type RightToWork = (typeof RightToWork)[keyof typeof RightToWork]

export const RIGHT_TO_WORK_LABELS: Record<RightToWork, string> = {
  [RightToWork.Citizen]: 'Australian citizen',
  [RightToWork.PermanentResident]: 'Permanent resident',
  [RightToWork.VisaHolder]: 'Visa with work rights',
}
