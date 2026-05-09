/**
 * Composable: reactive view of the current professional's applications.
 *
 * Joins `useApplicationsStore.applications` with `useShiftsStore.shifts`
 * (so each row carries its shift context — role, date/time, location, rate)
 * and exposes filter + search state. Also surfaces a `cancel` action so
 * the pro can withdraw an application that's still pending.
 */

import { computed, ref } from 'vue'
import { useApplicationsStore } from '@/stores/applications'
import { useShiftsStore } from '@/stores/shifts'
import { useAuthStore } from '@/stores/auth'
import type { ShiftApplication } from '@/modules/applications/types'
import { ApplicationStatus } from '@/modules/applications/enums'
import type { Shift } from '@/modules/shifts/types'

export type ApplicationsFilter =
  | 'all'
  | 'pending'
  | 'accepted'
  | 'declined'

/** A joined row — one application + its shift. Used by the list UI. */
export interface ProfessionalApplicationRow {
  application: ShiftApplication
  shift: Shift
}

export function useProfessionalApplications() {
  const auth = useAuthStore()
  const applicationsStore = useApplicationsStore()
  const shiftsStore = useShiftsStore()

  const filter = ref<ApplicationsFilter>('all')
  const searchQuery = ref<string>('')

  /** Every application by the active professional — joined with its shift.
   *  Sorted appliedAt DESC (most recent first). */
  const allRows = computed<ProfessionalApplicationRow[]>(() => {
    const proId = auth.userId
    if (!proId) return []

    const byShiftId = new Map<string, Shift>(
      shiftsStore.shifts.map((s) => [s.id, s]),
    )

    const rows: ProfessionalApplicationRow[] = []
    for (const app of applicationsStore.applications) {
      if (app.professionalId !== proId) continue
      const shift = byShiftId.get(app.shiftId)
      if (!shift) continue
      rows.push({ application: app, shift })
    }

    return rows.sort((a, b) =>
      b.application.appliedAt.localeCompare(a.application.appliedAt),
    )
  })

  /** Counts per filter — used by the tab pills. */
  const counts = computed(() => {
    const all = allRows.value
    return {
      all: all.length,
      pending: all.filter((r) => r.application.status === ApplicationStatus.Pending).length,
      accepted: all.filter((r) => r.application.status === ApplicationStatus.Accepted).length,
      declined: all.filter((r) => r.application.status === ApplicationStatus.Declined).length,
    }
  })

  /** Filtered + searched view that the list renders. */
  const rows = computed<ProfessionalApplicationRow[]>(() => {
    const q = searchQuery.value.trim().toLowerCase()
    return allRows.value.filter((r) => {
      // Status filter.
      if (filter.value !== 'all' && r.application.status !== filter.value) {
        return false
      }
      // Search.
      if (!q) return true
      const haystack = [
        r.shift.role,
        r.shift.location ?? '',
        r.application.message ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  })

  /**
   * Cancel a pending application. Returns true if it was cancelled,
   * false if it couldn't be (e.g. already accepted or already gone).
   * The store enforces ownership (only the pro who applied can cancel)
   * and the pending-only rule.
   */
  function cancel(applicationId: string): boolean {
    const proId = auth.userId
    if (!proId) return false
    return applicationsStore.cancel(applicationId, proId) !== null
  }

  return {
    filter,
    searchQuery,
    rows,
    counts,
    cancel,
  }
}
