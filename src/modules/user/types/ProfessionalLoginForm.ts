/**
 * Form types for the professional login flow.
 *
 * The mock auth accepts any password >= 6 chars — we still model the field
 * because the real flow will need it, and so the demo looks like a real form.
 */

export interface ProfessionalLoginFormValues {
  email: string
  password: string
}

export type ProfessionalLoginFormErrors = Partial<
  Record<keyof ProfessionalLoginFormValues, string>
> & {
  /** Banner-level error not tied to a specific field. */
  form?: string
}

export type ProfessionalLoginFormStatus = 'idle' | 'submitting' | 'error' | 'success'
