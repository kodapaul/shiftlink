/**
 * Composable: reactive schedule view for the current professional.
 *
 * Returns the shifts they've claimed (their accepted applications), grouped
 * into Upcoming and Past, sorted by date. Pure read — claims are written
 * by the existing accept-application flow on the facility side.
 *
 * "Today" counts as upcoming so a same-day shift doesn't disappear from the
 * Upcoming section the moment its start time passes.
 */

import { computed } from 'vue'
import { useApplicationsStore } from '@/stores/applications'
import { useShiftsStore } from '@/stores/shifts'
import { useAuthStore } from '@/stores/auth'
import type { ShiftApplication } from '@/modules/applications/types'
import { ApplicationStatus } from '@/modules/applications/enums'
import type { Shift } from '@/modules/shifts/types'

/** A scheduled shift — one accepted application + the shift it claimed. */
export interface ProfessionalScheduleRow {
  application: ShiftApplication
  shift: Shift
}

function todayISO(): string {
  // YYYY-MM-DD in local time so a shift "today" doesn't get pushed to past
  // by UTC rollover.
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function useProfessionalSchedule() {
  const auth = useAuthStore()
  const applicationsStore = useApplicationsStore()
  const shiftsStore = useShiftsStore()

  /** Every accepted application by the active professional, joined with its
   *  shift. Sorted by shift date ASC, then start time ASC. */
  const allRows = computed<ProfessionalScheduleRow[]>(() => {
    const proId = auth.userId
    if (!proId) return []

    const byShiftId = new Map<string, Shift>(
      shiftsStore.shifts.map((s) => [s.id, s]),
    )

    const rows: ProfessionalScheduleRow[] = []
    for (const app of applicationsStore.applications) {
      if (app.professionalId !== proId) continue
      if (app.status !== ApplicationStatus.Accepted) continue
      const shift = byShiftId.get(app.shiftId)
      if (!shift) continue
      rows.push({ application: app, shift })
    }

    return rows.sort(
      (a, b) =>
        a.shift.date.localeCompare(b.shift.date) ||
        a.shift.startTime.localeCompare(b.shift.startTime),
    )
  })

  const upcoming = computed<ProfessionalScheduleRow[]>(() => {
    const today = todayISO()
    return allRows.value.filter((r) => r.shift.date >= today)
  })

  const past = computed<ProfessionalScheduleRow[]>(() => {
    const today = todayISO()
    // Most recent first for the past list — easier to scan.
    return allRows.value
      .filter((r) => r.shift.date < today)
      .slice()
      .reverse()
  })

  const counts = computed(() => ({
    total: allRows.value.length,
    upcoming: upcoming.value.length,
    past: past.value.length,
  }))

  /** The very next shift, if any. Used on the dashboard for a hero card. */
  const nextShift = computed<ProfessionalScheduleRow | null>(
    () => upcoming.value[0] ?? null,
  )

  return {
    allRows,
    upcoming,
    past,
    counts,
    nextShift,
  }
}
