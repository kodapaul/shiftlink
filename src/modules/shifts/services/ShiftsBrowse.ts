/**
 * Service layer for the professional shift-browse experience.
 *
 * Pure functions — no Vue runtime, no API calls. The composable wraps
 * these with reactive state.
 *
 * Three responsibilities:
 *   1. `filterShifts` — apply the user's search + filter selections to the
 *      list of open shifts.
 *   2. `appliedShiftIdsFor` — derive the set of shift ids the active
 *      professional has already applied to (any status). Used to render
 *      the "Applied" pill and disable the Apply button on those rows.
 *   3. `bestApplicationForShift` — when a row is "applied", which
 *      application status do we surface? Most recent decision wins:
 *      accepted > pending > declined. Used by the row's pill.
 */

import { ApplicationStatus } from '@/modules/applications/enums'
import type { ShiftApplication } from '@/modules/applications/types'
import type { Shift } from '../types/Shift'
import type { ShiftType } from '../enums/ShiftType'

export interface ShiftsBrowseFilters {
  /** Free-text search across role, location, and notes. */
  searchQuery: string
  /** When non-empty, only shifts whose `shiftType` is in the set are shown.
   *  Typed as a mutable `Set` so the composable can `.add()` / `.delete()`
   *  on toggle; the filter function only reads via `.has()`. */
  shiftTypes: Set<ShiftType>
  /** When true, only `urgency === 'urgent'` shifts are shown. */
  urgentOnly: boolean
}

/**
 * Filter the open-shift list by the active filters. Pure; the composable
 * memoises the result.
 *
 * Search is case-insensitive substring match across role / location /
 * notes (HTML stripped). Shift-type filter is OR'd within the type set.
 * Urgency is a hard AND — when true, only urgent shifts make it through.
 */
export function filterShifts(
  shifts: readonly Shift[],
  filters: ShiftsBrowseFilters,
): Shift[] {
  const q = filters.searchQuery.trim().toLowerCase()
  const hasShiftTypeFilter = filters.shiftTypes.size > 0

  return shifts.filter((s) => {
    if (hasShiftTypeFilter && !filters.shiftTypes.has(s.shiftType)) return false
    if (filters.urgentOnly && s.urgency !== 'urgent') return false
    if (!q) return true

    const haystack = [
      s.role,
      s.location ?? '',
      // Strip tags from notes so users can search the prose without
      // leaking HTML matches.
      (s.notes ?? '').replace(/<[^>]*>/g, ' '),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

/**
 * Set of shift ids the given professional has applied to (any status).
 * Used by the row to render an "Applied" pill in place of the Apply button.
 */
export function appliedShiftIdsFor(
  applications: readonly ShiftApplication[],
  professionalId: string | null,
): Set<string> {
  const set = new Set<string>()
  if (!professionalId) return set
  for (const app of applications) {
    if (app.professionalId === professionalId) set.add(app.shiftId)
  }
  return set
}

/**
 * The most-relevant application this professional has on a given shift,
 * or null if they haven't applied. Picks accepted > pending > declined so
 * the row's status pill always reflects the strongest signal.
 */
export function bestApplicationForShift(
  applications: readonly ShiftApplication[],
  shiftId: string,
  professionalId: string | null,
): ShiftApplication | null {
  if (!professionalId) return null
  const own = applications.filter(
    (a) => a.shiftId === shiftId && a.professionalId === professionalId,
  )
  if (own.length === 0) return null
  return (
    own.find((a) => a.status === ApplicationStatus.Accepted) ??
    own.find((a) => a.status === ApplicationStatus.Pending) ??
    own[0]!
  )
}
