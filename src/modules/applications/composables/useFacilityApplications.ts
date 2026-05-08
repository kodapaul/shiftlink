/**
 * Composable: cross-shift applications view.
 *
 * Reads the full applications store, joins each row with its shift + the
 * professional record, and exposes filtered / searchable lists for the
 * facility-side `/facility/applications` aggregate page.
 *
 * Distinct from `useShiftApplications(shiftId)` which is scoped to one shift.
 */

import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { useApplicationsStore } from '@/stores/applications'
import { useShiftsStore } from '@/stores/shifts'
import { useAuthStore } from '@/stores/auth'
import { ApplicationStatus } from '@/modules/applications/enums'
import type { ShiftApplication } from '@/modules/applications/types'
import type { Shift } from '@/modules/shifts/types'
import type { Professional } from '@/modules/professional/types'
import professionalsData from '@/data/professionals.json'

export type ApplicationsFilter = 'pending' | 'accepted' | 'declined' | 'all'

export interface ApplicationRow {
  application: ShiftApplication
  shift: Shift | null
  professional: Professional | null
}

export interface UseFacilityApplicationsApi {
  // The active filter and search query are owned here so the view can stay dumb.
  filter: Ref<ApplicationsFilter>
  searchQuery: Ref<string>
  // Tab counts.
  pendingCount: ComputedRef<number>
  acceptedCount: ComputedRef<number>
  declinedCount: ComputedRef<number>
  totalCount: ComputedRef<number>
  // The fully-joined, filter+search-applied list. Sorted: pending first by
  // newest applied-at, then accepted, then declined.
  rows: ComputedRef<ApplicationRow[]>
  // Pass-through to the store actions, but resolves the deciding staff id
  // from auth so callers don't have to.
  accept: (applicationId: string) => ShiftApplication | null
  decline: (applicationId: string) => ShiftApplication | null
}

const professionals = professionalsData as Professional[]

const STATUS_ORDER: Record<ApplicationStatus, number> = {
  [ApplicationStatus.Pending]: 0,
  [ApplicationStatus.Accepted]: 1,
  [ApplicationStatus.Declined]: 2,
}

export function useFacilityApplications(): UseFacilityApplicationsApi {
  const applicationsStore = useApplicationsStore()
  const shiftsStore = useShiftsStore()
  const auth = useAuthStore()

  const filter = ref<ApplicationsFilter>('pending')
  const searchQuery = ref('')

  // Tab counts read from the raw store list, not the filtered rows below.
  const pendingCount = computed(
    () =>
      applicationsStore.applications.filter(
        (a) => a.status === ApplicationStatus.Pending,
      ).length,
  )
  const acceptedCount = computed(
    () =>
      applicationsStore.applications.filter(
        (a) => a.status === ApplicationStatus.Accepted,
      ).length,
  )
  const declinedCount = computed(
    () =>
      applicationsStore.applications.filter(
        (a) => a.status === ApplicationStatus.Declined,
      ).length,
  )
  const totalCount = computed(() => applicationsStore.applications.length)

  // O(1) lookups while building rows.
  const professionalsById = computed(() => {
    const map = new Map<string, Professional>()
    for (const p of professionals) map.set(p.id, p)
    return map
  })

  const shiftsById = computed(() => {
    const map = new Map<string, Shift>()
    for (const s of shiftsStore.shifts) map.set(s.id, s)
    return map
  })

  // Joined + filtered + searched + sorted.
  const rows = computed<ApplicationRow[]>(() => {
    const all = applicationsStore.applications

    // Status filter.
    const byStatus =
      filter.value === 'all'
        ? all
        : all.filter((a) => a.status === filter.value)

    // Search across professional name + shift role + message.
    const q = searchQuery.value.trim().toLowerCase()
    const matched = q
      ? byStatus.filter((a) => {
          const pro = professionalsById.value.get(a.professionalId)
          const shift = shiftsById.value.get(a.shiftId)
          const haystack = [
            pro?.name ?? '',
            shift?.role ?? '',
            shift?.location ?? '',
            a.message ?? '',
          ]
            .join(' ')
            .toLowerCase()
          return haystack.includes(q)
        })
      : byStatus

    // Build rows + sort.
    const out: ApplicationRow[] = matched.map((a) => ({
      application: a,
      shift: shiftsById.value.get(a.shiftId) ?? null,
      professional: professionalsById.value.get(a.professionalId) ?? null,
    }))

    out.sort((a, b) => {
      const byStatusOrder =
        STATUS_ORDER[a.application.status] - STATUS_ORDER[b.application.status]
      if (byStatusOrder !== 0) return byStatusOrder
      return b.application.appliedAt.localeCompare(a.application.appliedAt)
    })

    return out
  })

  function accept(applicationId: string): ShiftApplication | null {
    const staffId = auth.userId
    if (!staffId) return null
    return applicationsStore.accept(applicationId, staffId)
  }

  function decline(applicationId: string): ShiftApplication | null {
    const staffId = auth.userId
    if (!staffId) return null
    return applicationsStore.decline(applicationId, staffId)
  }

  return {
    filter,
    searchQuery,
    pendingCount,
    acceptedCount,
    declinedCount,
    totalCount,
    rows,
    accept,
    decline,
  }
}
