/**
 * Composable: state + actions for the professional shift-browse view at
 * `/shifts`.
 *
 * Owns:
 *   - filter state (search query, shift-type set, urgent-only toggle)
 *   - selection state (which shift is highlighted on the map / open in the
 *     dialog)
 *   - the apply gate — derived from the active professional's profile
 *     completeness (per `professional/services/ProfessionalProfileForm`)
 *   - the apply action — wraps `useApplicationsStore.apply()` with a
 *     gate-and-existing-application check so we never create duplicates
 */

import { computed, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useShiftsStore } from '@/stores/shifts'
import { useApplicationsStore } from '@/stores/applications'
import {
  computeProfileCompleteness,
  populateProfessionalProfileForm,
} from '@/modules/professional/services/ProfessionalProfileForm'
import type { ShiftType } from '../enums/ShiftType'
import type { Shift } from '../types/Shift'
import {
  appliedShiftIdsFor,
  bestApplicationForShift,
  filterShifts,
  type ShiftsBrowseFilters,
} from '../services/ShiftsBrowse'

export interface ApplyResult {
  ok: boolean
  /** Set on `ok: false` so the dialog can render a banner. */
  reason?: 'profile-incomplete' | 'already-applied' | 'no-session'
}

export function useShiftsBrowse() {
  const auth = useAuthStore()
  const shiftsStore = useShiftsStore()
  const applicationsStore = useApplicationsStore()

  // --- Filter state ----------------------------------------------------
  const filters = reactive<ShiftsBrowseFilters>({
    searchQuery: '',
    shiftTypes: new Set<ShiftType>(),
    urgentOnly: false,
  })

  function toggleShiftType(t: ShiftType): void {
    if (filters.shiftTypes.has(t)) filters.shiftTypes.delete(t)
    else filters.shiftTypes.add(t)
  }

  function clearFilters(): void {
    filters.searchQuery = ''
    filters.shiftTypes = new Set<ShiftType>()
    filters.urgentOnly = false
  }

  // --- Derived list ----------------------------------------------------
  /** Open shifts only — pros can never apply to a claimed shift. */
  const openShifts = computed<readonly Shift[]>(() => shiftsStore.openShifts)

  const filteredShifts = computed<Shift[]>(() =>
    filterShifts(openShifts.value, filters),
  )

  /** Set of shift ids the active pro has applied to (any status). */
  const appliedShiftIds = computed<Set<string>>(() =>
    appliedShiftIdsFor(applicationsStore.applications, auth.userId),
  )

  /** The active pro's strongest application against a given shift, if any. */
  function applicationFor(shiftId: string) {
    return bestApplicationForShift(
      applicationsStore.applications,
      shiftId,
      auth.userId,
    )
  }

  function hasApplied(shiftId: string): boolean {
    return appliedShiftIds.value.has(shiftId)
  }

  // --- Selection (map + row sync) -------------------------------------
  /** The shift highlighted on the map / opened in the apply dialog. */
  const selectedId = ref<string | null>(null)

  function selectShift(id: string | null): void {
    selectedId.value = id
  }

  const selectedShift = computed<Shift | null>(() =>
    selectedId.value
      ? shiftsStore.shifts.find((s) => s.id === selectedId.value) ?? null
      : null,
  )

  // --- Apply gate ------------------------------------------------------
  /** Profile completeness for the current session, derived live. */
  const completeness = computed(() => {
    const pro = auth.currentProfessional
    if (!pro) return null
    return computeProfileCompleteness(populateProfessionalProfileForm(pro))
  })

  const profileIsComplete = computed<boolean>(
    () => completeness.value?.isComplete ?? false,
  )

  // --- Apply action ----------------------------------------------------
  /**
   * Submit an application for `shiftId` with an optional message. Returns
   * a discriminated result so the dialog can render an error banner if
   * the gate rejects the call.
   */
  function applyToShift(shiftId: string, message: string): ApplyResult {
    const proId = auth.userId
    if (!proId || !auth.isProfessional) {
      return { ok: false, reason: 'no-session' }
    }
    if (!profileIsComplete.value) {
      return { ok: false, reason: 'profile-incomplete' }
    }
    if (hasApplied(shiftId)) {
      return { ok: false, reason: 'already-applied' }
    }

    applicationsStore.apply({
      shiftId,
      professionalId: proId,
      message: message.trim() || undefined,
    })
    return { ok: true }
  }

  return {
    // filters
    filters,
    toggleShiftType,
    clearFilters,
    // derived list
    openShifts,
    filteredShifts,
    appliedShiftIds,
    applicationFor,
    hasApplied,
    // selection
    selectedId,
    selectedShift,
    selectShift,
    // gate + apply
    completeness,
    profileIsComplete,
    applyToShift,
  }
}
