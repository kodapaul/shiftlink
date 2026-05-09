/**
 * Composable: reactive glue for the professional profile form, used by the
 * dedicated edit route at `/professional/edit`.
 *
 * Owns reactive state and exposes a small API:
 *   - values / errors / status — the standard form-state trio
 *   - completeness — derived from the *current form values* so the badge
 *     updates as the user types, not just on save
 *   - hydrate() — pull current values from the auth store. Called on mount
 *     and on auth change (e.g. switching demo accounts mid-session).
 *   - save() — validate, build a patch, hand it to the auth store. Returns
 *     the updated `Professional` on success, `null` on validation failure.
 *
 * Read-mode display is owned by `ProfessionalProfileTab.vue` directly; this
 * composable is edit-only. The URL (`/professional` vs `/professional/edit`)
 * is the source of truth for which mode the user is in.
 */

import { computed, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  buildProfilePatchFromForm,
  computeProfileCompleteness,
  emptyProfessionalProfileForm,
  populateProfessionalProfileForm,
  validateProfessionalProfileForm,
} from '../services/ProfessionalProfileForm'
import type {
  ProfessionalProfileFormErrors,
  ProfessionalProfileFormStatus,
  ProfessionalProfileFormValues,
} from '../types'

export function useProfessionalProfileForm() {
  const auth = useAuthStore()

  const values = reactive<ProfessionalProfileFormValues>(emptyProfessionalProfileForm())
  const errors = ref<ProfessionalProfileFormErrors>({})
  const status = ref<ProfessionalProfileFormStatus>('idle')

  /** Pull current values from the auth store into the form's reactive
   *  buffer. Called on mount and any time the active professional changes. */
  function hydrate(): void {
    const pro = auth.currentProfessional
    if (!pro) {
      Object.assign(values, emptyProfessionalProfileForm())
      return
    }
    Object.assign(values, populateProfessionalProfileForm(pro))
  }

  hydrate()
  watch(
    () => auth.currentProfessional?.id,
    () => hydrate(),
  )

  const completeness = computed(() => computeProfileCompleteness(values))

  /**
   * Save. Validates, builds a patch, and hands it to the auth store. Returns
   * the updated `Professional` on success, `null` on validation failure.
   * The caller (the edit view) handles routing on success.
   */
  function save() {
    const fieldErrors = validateProfessionalProfileForm(values)
    errors.value = fieldErrors
    if (Object.keys(fieldErrors).length > 0) {
      status.value = 'error'
      return null
    }

    status.value = 'submitting'
    const patch = buildProfilePatchFromForm(values)
    const updated = auth.updateProfessionalProfile(patch)

    if (!updated) {
      status.value = 'error'
      errors.value = { form: 'Could not save — sign in again and try.' }
      return null
    }

    status.value = 'success'
    return updated
  }

  return {
    values,
    errors,
    status,
    completeness,
    hydrate,
    save,
  }
}
