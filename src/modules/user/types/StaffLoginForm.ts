/**
 * Form types for the staff login flow.
 *
 * The mock auth accepts any password >= 6 chars — we still model the field
 * because the real flow will need it, and so the demo looks like a real form.
 */

export interface StaffLoginFormValues {
  email: string
  password: string
}

export type StaffLoginFormErrors = Partial<Record<keyof StaffLoginFormValues, string>> & {
  /** Banner-level error not tied to a specific field (e.g. "no account for that email"). */
  form?: string
}

export type StaffLoginFormStatus = 'idle' | 'submitting' | 'error' | 'success'
