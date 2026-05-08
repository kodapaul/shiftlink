/**
 * Auth store — dummy authentication for the prototype.
 *
 * Persisted to localStorage so a "logged-in" session survives reload. Stores
 * the user's `userType`, the `userId` they're impersonating from the seed data,
 * and (for facility staff) the `facilityId` they belong to.
 *
 * Use `loginAsProfessional()` / `loginAsFacility()` to set the session — these
 * are the only mutators. Routing guards read `isAuthenticated` and `userType`.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { UserType } from '@/modules/user/enums/UserType'
import facilityStaffData from '@/data/facilityStaff.json'
import professionalsData from '@/data/professionals.json'
import type { FacilityStaff } from '@/modules/facility/types'
import type { Professional } from '@/modules/professional/types'

const facilityStaff = facilityStaffData as FacilityStaff[]
const professionals = professionalsData as Professional[]

export const useAuthStore = defineStore(
  'auth',
  () => {
    const userType = ref<UserType | null>(null)
    const userId = ref<string | null>(null)
    const facilityId = ref<string | null>(null)

    const isAuthenticated = computed(() => userType.value !== null)

    const isFacilityStaff = computed(() => userType.value === UserType.FacilityStaff)
    const isProfessional = computed(() => userType.value === UserType.Professional)

    /**
     * Log in as the demo professional (or a specific one by id).
     * In the real app, this would be the result of a real signup or login.
     */
    function loginAsProfessional(id?: string) {
      const target =
        (id ? professionals.find((p) => p.id === id) : professionals[0]) ?? professionals[0]
      if (!target) return
      userType.value = UserType.Professional
      userId.value = target.id
      facilityId.value = null
    }

    /**
     * Log in as the demo facility staff (or a specific one by id).
     * Sets `facilityId` from the staff member's record.
     */
    function loginAsFacility(id?: string) {
      const target =
        (id ? facilityStaff.find((s) => s.id === id) : facilityStaff[0]) ?? facilityStaff[0]
      if (!target) return
      userType.value = UserType.FacilityStaff
      userId.value = target.id
      facilityId.value = target.facilityId
    }

    function logout() {
      userType.value = null
      userId.value = null
      facilityId.value = null
    }

    /** The full FacilityStaff record for the current session, if any. */
    const currentFacilityStaff = computed<FacilityStaff | null>(() =>
      isFacilityStaff.value && userId.value
        ? facilityStaff.find((s) => s.id === userId.value) ?? null
        : null,
    )

    /** The full Professional record for the current session, if any. */
    const currentProfessional = computed<Professional | null>(() =>
      isProfessional.value && userId.value
        ? professionals.find((p) => p.id === userId.value) ?? null
        : null,
    )

    return {
      userType,
      userId,
      facilityId,
      isAuthenticated,
      isFacilityStaff,
      isProfessional,
      currentFacilityStaff,
      currentProfessional,
      loginAsProfessional,
      loginAsFacility,
      logout,
    }
  },
  {
    persist: true,
  },
)
