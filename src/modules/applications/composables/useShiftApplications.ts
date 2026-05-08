/**
 * Composable: applications scoped to a single shift.
 *
 * Wraps useApplicationsStore + useAuthStore so the consuming component
 * doesn't need to know about either. Returns reactive lists + sugar
 * methods for accept/decline that resolve the deciding staff id from auth.
 */

import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'
import { useApplicationsStore } from '@/stores/applications'
import { useAuthStore } from '@/stores/auth'
import {
  applicationsForShift,
  pendingApplicationsForShift,
  acceptedApplicationForShift,
  sortForReview,
} from '@/modules/applications/services'
import { ApplicationStatus } from '@/modules/applications/enums'
import type { ShiftApplication } from '@/modules/applications/types'

export interface UseShiftApplicationsApi {
  applications: ComputedRef<ShiftApplication[]>
  pendingApplications: ComputedRef<ShiftApplication[]>
  acceptedApplication: ComputedRef<ShiftApplication | undefined>
  declinedApplications: ComputedRef<ShiftApplication[]>
  pendingCount: ComputedRef<number>
  hasPending: ComputedRef<boolean>
  // Accept the given application. No-op if not pending.
  accept: (applicationId: string) => ShiftApplication | null
  // Decline the given application. No-op if not pending.
  decline: (applicationId: string) => ShiftApplication | null
}

export function useShiftApplications(
  shiftId: MaybeRefOrGetter<string>,
): UseShiftApplicationsApi {
  const store = useApplicationsStore()
  const auth = useAuthStore()

  // All applications for this shift, sorted for review (pending first).
  const applications = computed(() =>
    sortForReview(applicationsForShift(store.applications, toValue(shiftId))),
  )

  const pendingApplications = computed(() =>
    pendingApplicationsForShift(store.applications, toValue(shiftId)),
  )

  const acceptedApplication = computed(() =>
    acceptedApplicationForShift(store.applications, toValue(shiftId)),
  )

  const declinedApplications = computed(() =>
    applications.value.filter((a) => a.status === ApplicationStatus.Declined),
  )

  const pendingCount = computed(() => pendingApplications.value.length)
  const hasPending = computed(() => pendingCount.value > 0)

  function accept(applicationId: string): ShiftApplication | null {
    const staffId = auth.userId
    if (!staffId) return null
    return store.accept(applicationId, staffId)
  }

  function decline(applicationId: string): ShiftApplication | null {
    const staffId = auth.userId
    if (!staffId) return null
    return store.decline(applicationId, staffId)
  }

  return {
    applications,
    pendingApplications,
    acceptedApplication,
    declinedApplications,
    pendingCount,
    hasPending,
    accept,
    decline,
  }
}
