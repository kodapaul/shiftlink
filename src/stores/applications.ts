/**
 * Applications store. Source of truth for ShiftApplication records.
 *
 * Hydrates from src/data/applications.json on first load. Persists to
 * localStorage via pinia-plugin-persistedstate so accept/decline state
 * survives reload.
 *
 * Cross-store side effects live here: when an application is accepted, this
 * store also flips the related Shift to 'claimed' (via useShiftsStore) and
 * declines other pending applications for the same shift. Keeping this in
 * one place avoids leaking the policy into components.
 */

import { defineStore } from 'pinia'
import { computed, ref, type Ref } from 'vue'
import applicationsSeed from '@/data/applications.json'
import type { ShiftApplication } from '@/modules/applications/types'
import { ApplicationStatus } from '@/modules/applications/enums'
import { useShiftsStore } from '@/stores/shifts'
import { ShiftStatus } from '@/modules/shifts/enums'

const seedApplications = applicationsSeed as ShiftApplication[]

// Input shape for a new application. The store fills id, status, appliedAt.
export type NewApplicationInput = Pick<
  ShiftApplication,
  'shiftId' | 'professionalId' | 'message'
>

export const useApplicationsStore = defineStore(
  'applications',
  () => {
    const applications: Ref<ShiftApplication[]> = ref([])

    // Hydrate from the seed when the store is empty.
    function hydrateIfEmpty(): void {
      if (applications.value.length === 0) {
        applications.value = seedApplications.slice() as ShiftApplication[]
      }
    }

    // Reset to the original seed (used for "reset demo" actions).
    function resetToSeed(): void {
      applications.value = seedApplications.slice() as ShiftApplication[]
    }

    function getById(id: string): ShiftApplication | undefined {
      return applications.value.find((a) => a.id === id)
    }

    // Compose a new application id. Format: app_NNN, auto-incrementing.
    function nextId(): string {
      let n = 1
      const existing = new Set(applications.value.map((a) => a.id))
      while (existing.has(`app_${String(n).padStart(3, '0')}`)) n++
      return `app_${String(n).padStart(3, '0')}`
    }

    // Replace one application in-place. Persistedstate writes the change.
    function replace(next: ShiftApplication): void {
      const idx = applications.value.findIndex((a) => a.id === next.id)
      if (idx === -1) return
      applications.value.splice(idx, 1, next)
    }

    /**
     * Create a new pending application. Used by the future professional-side
     * "apply" flow. Returns the created record.
     */
    function apply(input: NewApplicationInput): ShiftApplication {
      const created: ShiftApplication = {
        id: nextId(),
        shiftId: input.shiftId,
        professionalId: input.professionalId,
        status: ApplicationStatus.Pending,
        appliedAt: new Date().toISOString(),
        message: input.message,
      }
      applications.value.unshift(created)
      return created
    }

    /**
     * Accept an application. Flips the linked Shift to 'claimed' and
     * auto-declines other pending applications for the same shift. Returns
     * the accepted application or null if not found / not pending.
     */
    function accept(applicationId: string, decidedByStaffId: string): ShiftApplication | null {
      const target = getById(applicationId)
      if (!target || target.status !== ApplicationStatus.Pending) return null

      const decidedAt = new Date().toISOString()

      // Mark this one accepted.
      const accepted: ShiftApplication = {
        ...target,
        status: ApplicationStatus.Accepted,
        decidedAt,
        decidedByStaffId,
      }
      replace(accepted)

      // Auto-decline other pending applications for the same shift.
      applications.value = applications.value.map((a) => {
        if (
          a.id !== accepted.id &&
          a.shiftId === accepted.shiftId &&
          a.status === ApplicationStatus.Pending
        ) {
          return {
            ...a,
            status: ApplicationStatus.Declined,
            decidedAt,
            decidedByStaffId,
          }
        }
        return a
      })

      // Side effect: the linked Shift becomes claimed.
      const shiftsStore = useShiftsStore()
      shiftsStore.update(accepted.shiftId, {
        status: ShiftStatus.Claimed,
        claimedByProfessionalId: accepted.professionalId,
        claimedAt: decidedAt,
      })

      return accepted
    }

    /**
     * Decline an application. Does not touch the linked Shift — other
     * applicants might still be considered.
     */
    function decline(applicationId: string, decidedByStaffId: string): ShiftApplication | null {
      const target = getById(applicationId)
      if (!target || target.status !== ApplicationStatus.Pending) return null

      const declined: ShiftApplication = {
        ...target,
        status: ApplicationStatus.Declined,
        decidedAt: new Date().toISOString(),
        decidedByStaffId,
      }
      replace(declined)
      return declined
    }

    /**
     * Cancel a pending application — initiated by the professional who
     * created it (NOT by facility staff). Removes the record entirely
     * so the pro can re-apply later if they change their mind. Only
     * pending applications can be cancelled; once accepted/declined the
     * decision is final and cancellation is a no-op.
     *
     * Returns the cancelled record if found and pending, otherwise null.
     */
    function cancel(applicationId: string, professionalId: string): ShiftApplication | null {
      const target = getById(applicationId)
      if (!target) return null
      if (target.status !== ApplicationStatus.Pending) return null
      if (target.professionalId !== professionalId) return null
      applications.value = applications.value.filter((a) => a.id !== applicationId)
      return target
    }

    // Convenience: total pending applications across all shifts.
    const pendingTotal = computed(() =>
      applications.value.filter((a) => a.status === ApplicationStatus.Pending).length,
    )

    return {
      applications,
      pendingTotal,
      hydrateIfEmpty,
      resetToSeed,
      getById,
      apply,
      accept,
      decline,
      cancel,
    }
  },
  // Same workaround as useShiftsStore: the plugin's S-extends-StateTree
  // augmentation can't narrow this setup store under pinia@3 + Vue 3.5 +
  // plugin@4.7 (actions returning ShiftApplication leak into the picked
  // state). Runtime works fine; persistence still applies.
  { persist: true } as Record<string, unknown>,
)
