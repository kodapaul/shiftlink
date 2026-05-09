/**
 * Composable: reactive glue for the professional login form.
 *
 * Wraps the pure service with Vue reactivity. On a successful submit, starts
 * a session via `useAuthStore.loginAsProfessional(id)` and routes to the
 * professional home (`/professional`). Professionals don't have an
 * onboarding step, so there's no first-login branch like staff has.
 */

import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  emptyProfessionalLoginForm,
  submitProfessionalLoginForm,
  validateProfessionalLoginForm,
} from '../services/ProfessionalLoginForm'
import type {
  ProfessionalLoginFormErrors,
  ProfessionalLoginFormStatus,
  ProfessionalLoginFormValues,
} from '../types/ProfessionalLoginForm'

export function useProfessionalLoginForm() {
  const auth = useAuthStore()
  const router = useRouter()

  const values = reactive<ProfessionalLoginFormValues>(emptyProfessionalLoginForm())
  const errors = ref<ProfessionalLoginFormErrors>({})
  const status = ref<ProfessionalLoginFormStatus>('idle')

  function reset() {
    Object.assign(values, emptyProfessionalLoginForm())
    errors.value = {}
    status.value = 'idle'
  }

  /**
   * Submit the form. On success, starts a session and routes to
   * `/professional`. Returns the resolved professional id, or null if
   * validation/lookup failed.
   */
  function submit(): string | null {
    // Pre-validate so the UI can show field errors immediately.
    const fieldErrors = validateProfessionalLoginForm(values)
    if (Object.keys(fieldErrors).length > 0) {
      errors.value = fieldErrors
      status.value = 'error'
      return null
    }

    status.value = 'submitting'

    const result = submitProfessionalLoginForm(values, (email) =>
      auth.findProfessionalByEmail(email),
    )

    if (result.status === 'error') {
      errors.value = result.errors
      status.value = 'error'
      return null
    }

    auth.loginAsProfessional(result.professional.id)
    errors.value = {}
    status.value = 'success'
    router.push('/professional')

    return result.professional.id
  }

  return {
    values,
    errors,
    status,
    submit,
    reset,
  }
}
