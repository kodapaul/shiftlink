/**
 * Composable: reactive glue for the post-shift / edit-shift form.
 *
 * Manages reactive state (values, errors, status) and exposes a clean API to
 * the form component. All business logic — validation, building the shift,
 * default times — lives in `services/PostShiftForm.ts`.
 *
 * Modes:
 *   - Create (default): submit() calls shiftsStore.create()
 *   - Edit  (pass `editingShiftId`): pre-fills from the existing shift, and
 *     submit() calls shiftsStore.update() instead.
 */

import { reactive, ref } from 'vue'
import type {
  PostShiftFormValues,
  PostShiftFormErrors,
  PostShiftFormStatus,
} from '../types/PostShiftForm'
import {
  emptyPostShiftForm,
  validatePostShiftForm,
  buildShiftDraft,
} from '../services/PostShiftForm'
import { useShiftsStore } from '@/stores/shifts'
import { useAuthStore } from '@/stores/auth'

interface UsePostShiftFormOptions {
  /** When set, the composable hydrates from this shift and submit() updates it instead of creating. */
  editingShiftId?: string
}

export function usePostShiftForm(options: UsePostShiftFormOptions = {}) {
  const shiftsStore = useShiftsStore()
  const authStore = useAuthStore()

  const values = reactive<PostShiftFormValues>(emptyPostShiftForm())
  const errors = ref<PostShiftFormErrors>({})
  const status = ref<PostShiftFormStatus>('idle')

  const isEditMode = !!options.editingShiftId

  // Hydrate from the existing shift when editing.
  if (options.editingShiftId) {
    const existing = shiftsStore.getById(options.editingShiftId)
    if (existing) {
      values.role = existing.role
      values.location = existing.location ?? ''
      values.date = existing.date
      values.startTime = existing.startTime
      values.endTime = existing.endTime
      values.hourlyRate = String(existing.hourlyRate)
      values.urgency = existing.urgency
      values.notes = existing.notes ?? ''
    }
  }

  function reset() {
    Object.assign(values, emptyPostShiftForm())
    errors.value = {}
    status.value = 'idle'
  }

  /**
   * Submit the form. Validates first; if invalid, populates errors and
   * returns null. If valid:
   *   - create mode → calls shiftsStore.create() and returns the new Shift
   *   - edit mode   → calls shiftsStore.update() and returns the updated Shift
   */
  function submit() {
    const validationErrors = validatePostShiftForm(values)
    errors.value = validationErrors
    if (Object.keys(validationErrors).length > 0) {
      status.value = 'error'
      return null
    }

    const postedByStaffId = authStore.userId
    if (!postedByStaffId) {
      status.value = 'error'
      errors.value = { role: 'Not signed in as facility staff' }
      return null
    }

    status.value = 'submitting'
    const draft = buildShiftDraft(values, postedByStaffId)

    if (options.editingShiftId) {
      const updated = shiftsStore.update(options.editingShiftId, draft)
      if (!updated) {
        status.value = 'error'
        errors.value = { role: 'Could not find the shift to update' }
        return null
      }
      status.value = 'success'
      return updated
    }

    const created = shiftsStore.create(draft)
    status.value = 'success'
    return created
  }

  return {
    values,
    errors,
    status,
    isEditMode,
    submit,
    reset,
  }
}
