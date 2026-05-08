/**
 * How urgent the facility's need to fill this shift is.
 * Drives badge styling and surfacing in the UI.
 */
export const Urgency = {
  Standard: 'standard',
  Urgent: 'urgent',
} as const

export type Urgency = (typeof Urgency)[keyof typeof Urgency]

export const URGENCY_LABELS: Record<Urgency, string> = {
  [Urgency.Standard]: 'Standard',
  [Urgency.Urgent]: 'Urgent',
}
