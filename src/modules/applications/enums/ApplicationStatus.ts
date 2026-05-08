// The lifecycle state of a professional's application to a shift.
export const ApplicationStatus = {
  Pending: 'pending',
  Accepted: 'accepted',
  Declined: 'declined',
} as const

export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus]

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.Pending]: 'Pending',
  [ApplicationStatus.Accepted]: 'Accepted',
  [ApplicationStatus.Declined]: 'Declined',
}
