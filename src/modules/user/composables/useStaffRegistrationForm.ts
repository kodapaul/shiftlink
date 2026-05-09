/**
 * Composable: reactive glue for the staff registration form.
 *
 * Builds a `FacilityStaff` from the form values (always assigned to the
 * single seeded facility) and registers them via
 * `useAuthStore.signUpAsFacility(...)`. On success, routes to onboarding.
 */

import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  buildStaffFromForm,
  emptyStaffRegistrationForm,
  validateStaffRegistrationForm,
} from '../services/StaffRegistrationForm'
import type {
  StaffRegistrationFormErrors,
  StaffRegistrationFormStatus,
  StaffRegistrationFormValues,
} from '../types/StaffRegistrationForm'

export function useStaffRegistrationForm() {
  const auth = useAuthStore()
  const router = useRouter()

  const values = reactive<StaffRegistrationFormValues>(emptyStaffRegistrationForm())
  const errors = ref<StaffRegistrationFormErrors>({})
  const status = ref<StaffRegistrationFormStatus>('idle')

  // Snapshot existing emails on every validate so newly-registered staff
  // (in the same browser session) also count as "taken".
  const existingEmails = computed<ReadonlySet<string>>(
    () => new Set(auth.allFacilityStaff.map((s) => s.email.toLowerCase())),
  )

  function reset() {
    Object.assign(values, emptyStaffRegistrationForm())
    errors.value = {}
    status.value = 'idle'
  }

  /**
   * Submit the form. Returns the new staff id on success, or null on
   * validation failure. On success, routes the user to onboarding.
   */
  function submit(): string | null {
    const fieldErrors = validateStaffRegistrationForm(values, existingEmails.value)
    errors.value = fieldErrors
    if (Object.keys(fieldErrors).length > 0) {
      status.value = 'error'
      return null
    }

    status.value = 'submitting'

    const staffId = auth.nextStaffId()
    const staff = buildStaffFromForm(values, staffId)

    auth.signUpAsFacility({ staff })
    status.value = 'success'

    // Brand-new staff always go through onboarding before the dashboard.
    router.push('/staff/onboarding')

    return staffId
  }

  return {
    values,
    errors,
    status,
    submit,
    reset,
  }
}
