/**
 * Composable: reactive glue for the staff login form.
 *
 * Wraps the pure service with Vue reactivity. On a successful submit, starts
 * a session via `useAuthStore.loginAsFacility(staffId)` and routes the user
 * forward (to onboarding if they haven't completed it, otherwise to the
 * facility dashboard).
 */

import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  emptyStaffLoginForm,
  submitStaffLoginForm,
  validateStaffLoginForm,
} from '../services/StaffLoginForm'
import type {
  StaffLoginFormErrors,
  StaffLoginFormStatus,
  StaffLoginFormValues,
} from '../types/StaffLoginForm'

export function useStaffLoginForm() {
  const auth = useAuthStore()
  const router = useRouter()

  const values = reactive<StaffLoginFormValues>(emptyStaffLoginForm())
  const errors = ref<StaffLoginFormErrors>({})
  const status = ref<StaffLoginFormStatus>('idle')

  function reset() {
    Object.assign(values, emptyStaffLoginForm())
    errors.value = {}
    status.value = 'idle'
  }

  /**
   * Submit the form. On success, starts a session and routes onward.
   * Returns the resolved staff id, or null if validation/lookup failed.
   */
  function submit(): string | null {
    // Pre-validate so the UI can show field errors immediately.
    const fieldErrors = validateStaffLoginForm(values)
    if (Object.keys(fieldErrors).length > 0) {
      errors.value = fieldErrors
      status.value = 'error'
      return null
    }

    status.value = 'submitting'

    const result = submitStaffLoginForm(values, (email) =>
      auth.findFacilityStaffByEmail(email),
    )

    if (result.status === 'error') {
      errors.value = result.errors
      status.value = 'error'
      return null
    }

    auth.loginAsFacility(result.staff.id)
    errors.value = {}
    status.value = 'success'

    // First-login users still need onboarding. Returning users go straight in.
    if (!auth.hasCompletedOnboarding) {
      router.push('/staff/onboarding')
    } else {
      router.push('/facility')
    }

    return result.staff.id
  }

  return {
    values,
    errors,
    status,
    submit,
    reset,
  }
}
