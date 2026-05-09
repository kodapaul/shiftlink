/**
 * Composable: reactive glue for the professional registration form.
 *
 * Builds a `Professional` from the form values and registers them via
 * `useAuthStore.signUpAsProfessional(...)`. On success, routes to
 * `/professional` (no onboarding step for professionals in this prototype).
 */

import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  buildProfessionalFromForm,
  emptyProfessionalRegistrationForm,
  validateProfessionalRegistrationForm,
} from '../services/ProfessionalRegistrationForm'
import type {
  ProfessionalRegistrationFormErrors,
  ProfessionalRegistrationFormStatus,
  ProfessionalRegistrationFormValues,
} from '../types/ProfessionalRegistrationForm'

export function useProfessionalRegistrationForm() {
  const auth = useAuthStore()
  const router = useRouter()

  const values = reactive<ProfessionalRegistrationFormValues>(
    emptyProfessionalRegistrationForm(),
  )
  const errors = ref<ProfessionalRegistrationFormErrors>({})
  const status = ref<ProfessionalRegistrationFormStatus>('idle')

  // Snapshot existing emails on every validate so newly-registered
  // professionals (in the same browser session) also count as "taken".
  const existingEmails = computed<ReadonlySet<string>>(
    () => new Set(auth.allProfessionals.map((p) => p.email.toLowerCase())),
  )

  function reset() {
    Object.assign(values, emptyProfessionalRegistrationForm())
    errors.value = {}
    status.value = 'idle'
  }

  /**
   * Submit the form. Returns the new professional id on success, or null on
   * validation failure. On success, routes the user to `/professional`.
   */
  function submit(): string | null {
    const fieldErrors = validateProfessionalRegistrationForm(values, existingEmails.value)
    errors.value = fieldErrors
    if (Object.keys(fieldErrors).length > 0) {
      status.value = 'error'
      return null
    }

    status.value = 'submitting'

    const professionalId = auth.nextProfessionalId()
    const professional = buildProfessionalFromForm(values, professionalId)

    auth.signUpAsProfessional({ professional })
    status.value = 'success'

    // No onboarding step for professionals — straight to their home.
    router.push('/professional')

    return professionalId
  }

  return {
    values,
    errors,
    status,
    submit,
    reset,
  }
}
