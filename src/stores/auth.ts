/**
 * Auth store — dummy authentication for the prototype.
 *
 * Persisted to localStorage so a "logged-in" session survives reload. Stores:
 *   - the active session (userType, userId, facilityId)
 *   - staff + professionals created via the registration flows (so login
 *     lookups can find them across reloads, since seed JSON is read-only at
 *     runtime)
 *   - the per-staff onboarding completion flag (professionals don't have an
 *     onboarding step, so no equivalent flag)
 *
 * Single-facility model: every staff account registered through the prototype
 * is assigned to the one seeded facility (`fac_001`). We do not let the
 * registration flow create new facilities — see `SINGLE_FACILITY_ID` in the
 * staff-registration service.
 */

import { defineStore } from 'pinia'
import { computed, ref, type Ref } from 'vue'
import { UserType } from '@/modules/user/enums/UserType'
import facilityStaffData from '@/data/facilityStaff.json'
import facilitiesData from '@/data/facilities.json'
import professionalsData from '@/data/professionals.json'
import type { Facility, FacilityStaff } from '@/modules/facility/types'
import type { Professional } from '@/modules/professional/types'

const seedFacilities = facilitiesData as Facility[]
const seedFacilityStaff = facilityStaffData as FacilityStaff[]
const seedProfessionals = professionalsData as Professional[]

/** Inputs for `signUpAsFacility`. The single-facility model means we never
 *  build a new Facility at signup time, so this is staff-only. */
export interface SignUpAsFacilityInput {
  staff: FacilityStaff
}

/** Inputs for `signUpAsProfessional`. Professionals are independent of any
 *  facility, so this is just the professional record. */
export interface SignUpAsProfessionalInput {
  professional: Professional
}

export const useAuthStore = defineStore(
  'auth',
  () => {
    // session
    const userType = ref<UserType | null>(null)
    const userId = ref<string | null>(null)
    const facilityId = ref<string | null>(null)

    // registration-time records, persisted alongside the session so login
    // lookups can find them on the next page load
    const createdStaff: Ref<FacilityStaff[]> = ref([])
    const createdProfessionals: Ref<Professional[]> = ref([])

    // Profile-tab edits to seeded professionals are stored here as patches
    // keyed by professional id. The seed JSON file stays read-only at
    // runtime; the merged `currentProfessional` / `allProfessionals` getters
    // apply the patch on top. Edits to professionals registered via
    // `signUpAsProfessional` mutate `createdProfessionals` directly instead.
    const professionalProfileOverrides: Ref<Record<string, Partial<Professional>>> =
      ref({})

    // tracks which staff have finished the onboarding flow at least once
    const onboardedStaffIds: Ref<string[]> = ref([])

    const isAuthenticated = computed(() => userType.value !== null)
    const isFacilityStaff = computed(() => userType.value === UserType.FacilityStaff)
    const isProfessional = computed(() => userType.value === UserType.Professional)

    // Combined views of seed + registration-time records. Used by login
    // lookups and the `current*` selectors.
    const allFacilityStaff = computed<FacilityStaff[]>(() => [
      ...seedFacilityStaff,
      ...createdStaff.value,
    ])

    /**
     * All professionals — seed records with profile-edit overrides applied,
     * plus any registered via `signUpAsProfessional`. Overrides are
     * shallow-merged on top so the latest profile values always win.
     */
    const allProfessionals = computed<Professional[]>(() => {
      const overrides = professionalProfileOverrides.value
      const seedWithOverrides = seedProfessionals.map((p) => {
        const patch = overrides[p.id]
        return patch ? { ...p, ...patch } : p
      })
      return [...seedWithOverrides, ...createdProfessionals.value]
    })

    /** Look up a facility staff record by email, case-insensitive. */
    function findFacilityStaffByEmail(email: string): FacilityStaff | undefined {
      const target = email.trim().toLowerCase()
      if (!target) return undefined
      return allFacilityStaff.value.find((s) => s.email.toLowerCase() === target)
    }

    /** Look up a professional by email, case-insensitive. */
    function findProfessionalByEmail(email: string): Professional | undefined {
      const target = email.trim().toLowerCase()
      if (!target) return undefined
      return allProfessionals.value.find((p) => p.email.toLowerCase() === target)
    }

    /**
     * Log in as a professional. Pass an explicit `id` from the login flow.
     * The no-arg form picks the first seed professional — useful for the
     * /demo backdoor and tests, not for the real login flow.
     */
    function loginAsProfessional(id?: string) {
      const target =
        (id ? allProfessionals.value.find((p) => p.id === id) : allProfessionals.value[0]) ??
        allProfessionals.value[0]
      if (!target) return
      userType.value = UserType.Professional
      userId.value = target.id
      facilityId.value = null
    }

    /**
     * Log in as a facility staff. Pass an explicit `id` from the login flow.
     * The no-arg form picks the first seed staff member — useful for the
     * /demo backdoor and tests, not for the real login flow.
     */
    function loginAsFacility(id?: string) {
      const target =
        (id ? allFacilityStaff.value.find((s) => s.id === id) : allFacilityStaff.value[0]) ??
        allFacilityStaff.value[0]
      if (!target) return
      userType.value = UserType.FacilityStaff
      userId.value = target.id
      facilityId.value = target.facilityId
    }

    /**
     * Register a new facility staff under the existing seeded facility, push
     * them onto the persisted array, and start a session as that staff.
     *
     * The mock onboarding flow runs immediately after this returns, gated on
     * `onboardedStaffIds` not containing the new staff id yet.
     */
    function signUpAsFacility(input: SignUpAsFacilityInput): FacilityStaff {
      createdStaff.value.push(input.staff)
      userType.value = UserType.FacilityStaff
      userId.value = input.staff.id
      facilityId.value = input.staff.facilityId
      return input.staff
    }

    /**
     * Register a new professional, push them onto the persisted array, and
     * start a session as that professional. Professionals don't have an
     * onboarding step in this prototype, so the caller routes straight to
     * the professional dashboard.
     */
    function signUpAsProfessional(input: SignUpAsProfessionalInput): Professional {
      createdProfessionals.value.push(input.professional)
      userType.value = UserType.Professional
      userId.value = input.professional.id
      facilityId.value = null
      return input.professional
    }

    /** Mark a staff member as having completed onboarding (idempotent). */
    function markOnboardingComplete(staffId: string): void {
      if (!onboardedStaffIds.value.includes(staffId)) {
        onboardedStaffIds.value.push(staffId)
      }
    }

    /**
     * Patch the active professional's profile.
     *
     * Routing:
     *   - If the active professional was created via the registration flow
     *     (lives in `createdProfessionals`), we mutate that array entry
     *     in place — no override row needed.
     *   - If the active professional is a seeded record, we record the patch
     *     in `professionalProfileOverrides` keyed by professional id. The
     *     seed JSON stays read-only at runtime; the merged
     *     `allProfessionals` / `currentProfessional` getters apply the patch.
     *
     * Patches stack — calling twice with `{ bio: 'a' }` then `{ bio: 'b' }`
     * leaves bio at 'b'. Pass `null` for an optional field to clear it.
     */
    function updateProfessionalProfile(
      patch: Partial<Professional>,
    ): Professional | null {
      const id = userId.value
      if (!isProfessional.value || !id) return null

      // Prefer mutating the registered record in-place when it exists.
      const createdIdx = createdProfessionals.value.findIndex((p) => p.id === id)
      if (createdIdx !== -1) {
        const next = { ...createdProfessionals.value[createdIdx]!, ...patch } as Professional
        createdProfessionals.value.splice(createdIdx, 1, next)
        return next
      }

      // Otherwise it's a seeded professional — record the patch as an override.
      const prev = professionalProfileOverrides.value[id] ?? {}
      professionalProfileOverrides.value = {
        ...professionalProfileOverrides.value,
        [id]: { ...prev, ...patch },
      }
      // Return the merged-view record so the caller sees the post-patch
      // state immediately (handy for "saved at" timestamps).
      return allProfessionals.value.find((p) => p.id === id) ?? null
    }

    function logout() {
      userType.value = null
      userId.value = null
      facilityId.value = null
    }

    /** Has the currently signed-in staff finished onboarding?
     *  Always true for non-staff sessions (professionals skip onboarding). */
    const hasCompletedOnboarding = computed<boolean>(() => {
      if (!isFacilityStaff.value || !userId.value) return true
      return onboardedStaffIds.value.includes(userId.value)
    })

    /** The full FacilityStaff record for the current session, if any. */
    const currentFacilityStaff = computed<FacilityStaff | null>(() =>
      isFacilityStaff.value && userId.value
        ? allFacilityStaff.value.find((s) => s.id === userId.value) ?? null
        : null,
    )

    /** The Facility associated with the current session, if any. */
    const currentFacility = computed<Facility | null>(() =>
      facilityId.value
        ? seedFacilities.find((f) => f.id === facilityId.value) ?? null
        : null,
    )

    /** The full Professional record for the current session, if any. */
    const currentProfessional = computed<Professional | null>(() =>
      isProfessional.value && userId.value
        ? allProfessionals.value.find((p) => p.id === userId.value) ?? null
        : null,
    )

    /** Compose a new staff id. Format: `fs_NNN`. */
    function nextStaffId(): string {
      let n = 1
      const existing = new Set(allFacilityStaff.value.map((s) => s.id))
      while (existing.has(`fs_${String(n).padStart(3, '0')}`)) n++
      return `fs_${String(n).padStart(3, '0')}`
    }

    /** Compose a new professional id. Format: `pro_NNN`. */
    function nextProfessionalId(): string {
      let n = 1
      const existing = new Set(allProfessionals.value.map((p) => p.id))
      while (existing.has(`pro_${String(n).padStart(3, '0')}`)) n++
      return `pro_${String(n).padStart(3, '0')}`
    }

    return {
      userType,
      userId,
      facilityId,
      createdStaff,
      createdProfessionals,
      professionalProfileOverrides,
      onboardedStaffIds,
      isAuthenticated,
      isFacilityStaff,
      isProfessional,
      hasCompletedOnboarding,
      currentFacilityStaff,
      currentFacility,
      currentProfessional,
      allFacilityStaff,
      allProfessionals,
      findFacilityStaffByEmail,
      findProfessionalByEmail,
      nextStaffId,
      nextProfessionalId,
      loginAsProfessional,
      loginAsFacility,
      signUpAsFacility,
      signUpAsProfessional,
      updateProfessionalProfile,
      markOnboardingComplete,
      logout,
    }
  },
  /* persistedstate's persist option doesn't narrow this setup-store's picked
   * state under pinia@3 + Vue 3.5 + plugin@4.7 (computed refs and actions
   * leak into the StateTree extraction). Runtime works fine — the cast is
   * just to satisfy the type checker. */
  { persist: true } as Record<string, unknown>,
)
