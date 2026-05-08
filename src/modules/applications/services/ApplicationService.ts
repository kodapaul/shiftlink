/**
 * Pure helper functions for ShiftApplication collections.
 * No Vue, no Pinia. Easy to unit-test, easy to reuse.
 */

import type { ShiftApplication } from '../types/ShiftApplication'
import { ApplicationStatus } from '../enums/ApplicationStatus'

// All applications for a given shift, in original order (no sort).
export function applicationsForShift(
  apps: ReadonlyArray<ShiftApplication>,
  shiftId: string,
): ShiftApplication[] {
  return apps.filter((a) => a.shiftId === shiftId)
}

// Pending-only applications for a given shift.
export function pendingApplicationsForShift(
  apps: ReadonlyArray<ShiftApplication>,
  shiftId: string,
): ShiftApplication[] {
  return apps.filter(
    (a) => a.shiftId === shiftId && a.status === ApplicationStatus.Pending,
  )
}

// Count pending applications for a shift, in one pass.
export function pendingCountForShift(
  apps: ReadonlyArray<ShiftApplication>,
  shiftId: string,
): number {
  let n = 0
  for (const a of apps) {
    if (a.shiftId === shiftId && a.status === ApplicationStatus.Pending) n++
  }
  return n
}

// The single accepted application for a shift, if any.
export function acceptedApplicationForShift(
  apps: ReadonlyArray<ShiftApplication>,
  shiftId: string,
): ShiftApplication | undefined {
  return apps.find((a) => a.shiftId === shiftId && a.status === ApplicationStatus.Accepted)
}

// Group applications by shift id. Used to render counts efficiently across many cards.
export function groupByShiftId(
  apps: ReadonlyArray<ShiftApplication>,
): Map<string, ShiftApplication[]> {
  const map = new Map<string, ShiftApplication[]>()
  for (const a of apps) {
    const list = map.get(a.shiftId)
    if (list) list.push(a)
    else map.set(a.shiftId, [a])
  }
  return map
}

// Sort: pending first (newest first), then accepted, then declined.
export function sortForReview(apps: ShiftApplication[]): ShiftApplication[] {
  const order: Record<ApplicationStatus, number> = {
    [ApplicationStatus.Pending]: 0,
    [ApplicationStatus.Accepted]: 1,
    [ApplicationStatus.Declined]: 2,
  }
  return [...apps].sort((a, b) => {
    const byStatus = order[a.status] - order[b.status]
    if (byStatus !== 0) return byStatus
    return b.appliedAt.localeCompare(a.appliedAt)
  })
}
