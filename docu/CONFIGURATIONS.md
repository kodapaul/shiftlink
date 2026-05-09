# CONFIGURATIONS

The architectural rules for this project. Read before adding any file.

## Agent role and mindset

You are a **senior software developer** with expertise in building production-grade web applications — particularly Vue 3, TypeScript, design systems, and front-end architecture.

A senior developer:

- **Plans before writing code.** Read CONFIGURATIONS.md and BRAND.md first. Determine the model/interfaces before touching the UI. Identify the smallest correct change before starting.
- **Thinks in modules, not files.** Every change has a place — a feature folder, a shared component, a helper, a service. Decide where it belongs before writing it.
- **Anticipates reuse.** Before duplicating a component or function, check if a shared one already exists. If a feature-local component is being copy-pasted into a second feature, promote it to `src/components/`.
- **Holds the design line.** UI work must conform to BRAND.md. If a request would violate the design system, push back rather than silently complying.
- **Pushes back on bad ideas.** If the user proposes something that conflicts with the brief, the architecture, or the design system, say so plainly and offer the better path. Do not capitulate just to be agreeable.
- **Updates documentation as part of the work.** Adding a feature without updating DOCUMENTATIONS.md or TODOS.md is incomplete work.

## Model selection

When delegating work to subagents or running Claude Code commands, choose the model deliberately:

| Model | Use for |
|---|---|
| **Opus 4.7** (this agent) | Architecture decisions, planning, design system work, multi-file refactors, anything that requires holding the full project context and weighing tradeoffs. The "senior developer" role belongs here. |
| **Sonnet 4.6** | Mid-level implementation work — building components from a clear spec, wiring up UI models and types, implementing services from defined interfaces, writing composables. The "execute the plan" role. |
| **Haiku 4.5** | Minor edits — copy tweaks, renaming, small refactors, formatting fixes, single-file changes with no ambiguity. The "fast surgical edit" role. |

**Rule of thumb:** if you have to *think*, use Opus. If you have to *implement a clear spec*, use Sonnet. If you have to *make a small precise change*, use Haiku.

Never use a heavier model than the task requires — it wastes time and budget. Never use a lighter model than the task requires — it produces sloppy work that a senior developer would have to redo.

## Domain

ShiftLink is a two-sided marketplace for **healthcare shift coverage** in **Australia**. Reference reading: [upaged.com](https://upaged.com).

**Professional side:** nurses (RN, EN), assistants in nursing (AIN), carers, midwives — people who claim shifts.

**Facility side:** hospitals, aged care homes, mental health units, clinics, community health, hospices — organisations that post shifts.

### Entities

| Entity | What it is | Key fields |
|---|---|---|
| `Professional` | A person who claims shifts | `role` (RN/EN/AIN/Carer/Midwife), `certifications`, `yearsExperience` |
| `FacilityStaff` | A person who manages shifts on behalf of a Facility | `facilityId`, `position` (NurseManager / ChargeNurse / RosterCoordinator / …) |
| `Facility` | The organisation itself | `name`, `type` (Hospital / AgedCare / …), `location` |
| `Shift` (Phase 4) | A posted opening | `facilityId`, `role`, `date`, `startTime`, `endTime`, `hourlyRate`, `status`, `urgency` |

### Relationships

- A `Facility` has many `FacilityStaff`.
- A `FacilityStaff` belongs to exactly one `Facility`.
- A `Shift` is owned by a `Facility` (via `facilityId`) — not a staff member, so shifts survive staff turnover.
- A `Professional` is independent — they do not belong to a facility.

### Auth model

`useAuthStore.userType` is a `UserType` value: `'professional' | 'facility_staff'`. The `'facility_staff'` case means a `FacilityStaff` person is logged in, acting on behalf of their `Facility` (referenced via `facilityId`). We do not need a third audience type — the entity distinction is in the data model, not the auth model.

### Where the domain types live

Entities live in the module that primarily owns them. Identity / auth concerns live in `user`.

```
src/modules/
  user/                                  ← auth-focused domain module
    types/User.ts                        ← base type for any human user (has type: UserType)
    enums/UserType.ts                    ← 'professional' | 'facility_staff'
  professional/
    types/Professional.ts
    enums/Role.ts
  facility/
    types/Facility.ts
    types/FacilityStaff.ts
    enums/FacilityType.ts
    enums/StaffPosition.ts
```

Each module has an `index.ts` barrel for clean imports, e.g.:

```ts
import type { Professional } from '@/modules/professional/types'
import { Role, ROLE_LABELS } from '@/modules/professional/enums'
import type { Facility, FacilityStaff } from '@/modules/facility/types'
import type { User } from '@/modules/user/types'
import { UserType } from '@/modules/user/enums'
```

## Stack

| Layer | Choice |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript (strict) |
| Build tool | Vite |
| Routing | Vue Router 4 |
| Styling | Tailwind CSS |
| Component primitives | shadcn-vue (selectively, themed — see BRAND.md) |
| State | **Pinia** + `pinia-plugin-persistedstate` (auto-syncs to `localStorage`) |
| Hosting | Firebase Hosting (SPA) |
| Mock data | Static TS files in `src/data/` |

## Folder structure

The repo follows a **modular-by-feature** layout. Each feature/module owns everything it needs in one place.

```
src/
  assets/                  # global CSS, fonts, images
  components/              # shared, reusable components (Button, Input, Card, PublicHeader, etc.)
  composables/             # shared composables (useAuth, useClaims, etc.)
  helpers/                 # general utility functions (formatDate, formatCurrency, etc.)
  data/                    # mock data (shifts.ts, facilities.ts)
  layouts/                 # route-level layout shells that wrap groups of routes (PublicLayout)
  views/                   # app-shared route views that aren't owned by a feature module (HomeView, AboutView, ContactView, NotFoundView)
  router/
    index.ts
  stores/                  # shared Pinia stores (auth, shifts, applications)
  modules/                 # feature modules AND domain modules — each follows the structure below
    user/                  # AUTH-FOCUSED domain module — owns User base type, UserType discriminator,
      types/                # AND auth flows (login, registration, onboarding)
      enums/                # File names are prefixed by audience (Staff…, Professional…) so the
      services/             # whole module stays flat — no sub-feature folders.
      composables/
      components/
      views/
      # Phase B adds Professional…Form.ts / useProfessional…Form.ts / etc. alongside the staff files.
    professional/          # owns Professional entity + Role enum (Phase B will add /shifts UI here)
      types/
      enums/
    facility/              # owns Facility + FacilityStaff entities + facility portal UI
      types/
      enums/
      services/
      composables/
      components/
      views/
    shifts/                # domain + feature: owns Shift entity + ShiftStatus / Urgency / ShiftType enums,
      types/                #   plus the professional shift browse + apply experience at /shifts
      enums/
      services/
      composables/
      components/
      views/
    applications/          # owns ShiftApplication entity + ApplicationStatus enum + UI primitives
      types/
      enums/
      services/
      composables/
      components/
  App.vue
  main.ts
```

### Rules

- **Feature-local first.** A component used only by `shifts/` belongs in `src/modules/shifts/components/`, not in `src/components/`. Promote to shared only when a second consumer appears.
- **Types live in `types/`.** Never inline a non-trivial interface in a `.vue` file. If a feature has form types, they go in `src/modules/<feature>/types/`.
- **Enums live in `enums/`.** Use the `as const` object pattern (see below). No magic strings in component code.
- **Services are pure-ish.** Services in `services/` should not import Vue runtime APIs. They take data, return data. Composables can wrap them with reactivity.
- **Helpers are stateless.** `src/helpers/` is for general functions (date formatting, currency, string utilities). No business logic.

### Domain modules vs feature modules

Modules under `src/modules/` come in two flavours, both following the same internal structure:

| Domain module | Feature module |
|---|---|
| Owns a slice of the **business domain** | Owns a **user-facing capability** |
| Examples: `accounts` (identity & orgs) | Examples: `landing`, `signup`, `shifts`, `facility` |
| May have only `types/` and `enums/` (no UI) | Always has `views/` and/or `components/` |
| Imported by feature modules | Imports from domain modules |

**Rule:** if you're modeling a real-world *thing* used by multiple features, it goes in a domain module. If you're building a *capability* with screens and forms, it goes in a feature module.

### Where types and enums live

Each domain entity lives in the module that primarily owns it. Identity / auth concerns live in `user`.

| Item | Location |
|---|---|
| `User` (base type — has `type: UserType` discriminator field) | `src/modules/user/types/User.ts` |
| `UserType` (discriminator: `'professional' \| 'facility_staff'` — used by auth, routing, signup) | `src/modules/user/enums/UserType.ts` |
| `Professional` entity | `src/modules/professional/types/Professional.ts` |
| `WorkingWithChildrenCheck` (compound type used by `Professional.wwcc`) | `src/modules/professional/types/Professional.ts` |
| `Role` enum (RN, EN, AIN, …) | `src/modules/professional/enums/Role.ts` |
| `Specialty` enum (clinical practice areas) | `src/modules/professional/enums/Specialty.ts` |
| `RightToWork` enum (Citizen / PR / VisaHolder) | `src/modules/professional/enums/RightToWork.ts` |
| `ProfessionalProfileForm…` types + `ProfessionalProfileCompleteness` | `src/modules/professional/types/ProfessionalProfileForm.ts` |
| `Facility` entity | `src/modules/facility/types/Facility.ts` |
| `FacilityStaff` entity | `src/modules/facility/types/FacilityStaff.ts` |
| `FacilityType` enum | `src/modules/facility/enums/FacilityType.ts` |
| `StaffPosition` enum | `src/modules/facility/enums/StaffPosition.ts` |
| Feature-specific form types (`SignupFormValues`, `PostShiftFormErrors`) | `src/modules/<feature>/types/` |
| Feature-specific enums (e.g., `SignupFormStep`) | `src/modules/<feature>/enums/` |
| `Shift` entity | `src/modules/shifts/types/Shift.ts` |
| `ShiftStatus` / `Urgency` / `ShiftType` enums | `src/modules/shifts/enums/` |
| `ShiftApplication` entity | `src/modules/applications/types/ShiftApplication.ts` |
| `ApplicationStatus` enum | `src/modules/applications/enums/ApplicationStatus.ts` |
| `StaffLoginFormValues` / `Errors` / `Status` | `src/modules/user/types/StaffLoginForm.ts` |
| `StaffRegistrationFormValues` / `Errors` / `Status` | `src/modules/user/types/StaffRegistrationForm.ts` |
| `ProfessionalLoginFormValues` / `Errors` / `Status` | `src/modules/user/types/ProfessionalLoginForm.ts` |
| `ProfessionalRegistrationFormValues` / `Errors` / `Status` | `src/modules/user/types/ProfessionalRegistrationForm.ts` |
| `OnboardingStep` enum | `src/modules/user/enums/OnboardingStep.ts` |

**No top-level `src/types/` or `src/enums/`.** Modular all the way down.

### What goes in `user/`?

The `user` module is **auth-focused** — its job is "who is logged in and what can they do at the routing level," plus the auth-flow UI itself. Things that belong here:

- `User` — the base shape every kind of human user shares (with `type: UserType` discriminator field)
- `UserType` — the enum used by auth state, route guards, signup branching, and the entity `type` field
- **All auth flows** — login, registration, onboarding for both audiences. Files live directly under the standard `types/`, `enums/`, `services/`, `composables/`, `components/`, `views/` folders, named with an audience prefix (`StaffLoginForm.ts`, `useStaffLoginForm.ts`, `StaffLoginView.vue`, and later `ProfessionalLoginForm.ts` etc.). This is a deliberate exception to the "audience-specific things live in their own module" rule — the auth flow *is* the audience-branching layer. We do **not** nest sub-feature folders inside `user/`.
- Later: `useAuthStore` could live here too instead of `src/stores/` (TBD — still under discussion)

Things that do **not** belong in `user/`:

- Audience-specific *entity* fields. Professional-specific fields → `professional/`. FacilityStaff-specific fields → `facility/`.
- Shift-related types — those go in `shifts/`.
- Form types for non-auth features — those go in their feature module.

If you find yourself adding something to `user/` that isn't about identity, auth, or onboarding, you're probably in the wrong module.

### Enum convention

Use the `as const` object pattern, not TypeScript's `enum`:

```ts
export const Role = {
  RegisteredNurse: 'registered_nurse',
  EnrolledNurse: 'enrolled_nurse',
} as const

export type Role = typeof Role[keyof typeof Role]

export const ROLE_LABELS: Record<Role, string> = {
  [Role.RegisteredNurse]: 'Registered Nurse',
  [Role.EnrolledNurse]: 'Enrolled Nurse',
}
```

Why: tree-shakes properly, no compile-to-objects bloat, plays nicely with JSON serialization, and labels (display strings) live next to values in the same file.

## Module-creation workflow

When building a new feature, follow this order — do not jump ahead:

1. **Define the model.** What entities exist? What are their fields, types, optional/required, allowed values?
2. **Write interfaces and enums** in `types/` and `enums/`.
3. **Write the service** in `services/` — pure functions that operate on the types.
4. **Write the composable** (if reactive state is needed) — wraps the service and exposes refs.
5. **Build the view and components** — UI only consumes the composable/service, never owns business logic.
6. **Add the route** in the module's `routes/` and register it in `src/router/index.ts`.
7. **Document the module** in `docu/DOCUMENTATIONS.md`.

Skipping step 1 (model first) is the single biggest source of rework. Don't.

## Type-safety rules

- **No `any`.** Use `unknown` and narrow, or define the type properly.
- **No implicit any.** TypeScript `strict: true` is non-negotiable.
- **Use utility types** — `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`, `Readonly<T>`, `Record<K, V>` — to derive types instead of duplicating shapes.
- **Discriminated unions** for things like form state (`{ status: 'idle' } | { status: 'loading' } | { status: 'error', error: string } | { status: 'success', data: T }`).
- **Props and emits typed explicitly** in every `<script setup>` component:

```ts
defineProps<{ shift: Shift; claimed: boolean }>()
defineEmits<{ (e: 'claim', id: string): void }>()
```

- **No `as` casts** unless narrowing a known-safe value. Prefer type guards.

## Reusable component principles

- **Single responsibility.** A component does one thing. If it's accumulating props, split it.
- **Slots over props for content.** If a parent needs to inject markup, use a slot.
- **No business logic in components.** Components render and emit. Logic lives in composables/services.
- **Style with Tailwind classes** — no `<style scoped>` unless absolutely necessary (animations, complex pseudo-states).
- **Accessibility is non-optional.** All interactive elements must be keyboard-reachable, have a visible focus state, and use semantic HTML.

## Naming conventions

- **Files:** `kebab-case.vue` for components, `camelCase.ts` for non-component TS, `PascalCase.ts` only for type-only files (`Shift.ts` exporting `Shift` interface).
- **Components:** `PascalCase` in templates and exports (`<ShiftCard />`).
- **Composables:** `useXxx` (`useAuth`, `useClaims`).
- **Enums:** `PascalCase` for the enum, `SCREAMING_SNAKE_CASE` or `PascalCase` for members — be consistent within a file.
- **Types/interfaces:** `PascalCase`. Prefer `interface` for object shapes, `type` for unions/utility-derived.

## State management (Pinia)

We use **Pinia** with `pinia-plugin-persistedstate` for any state that needs to live beyond a single component or persist across reloads.

### When to use Pinia vs a composable

- **Pinia store** — state that is *shared* across multiple components/views, or needs to *persist* via localStorage. Examples: auth, claimed shifts, global filters.
- **Local composable** — state that is reactive but only used inside one feature/view. Examples: form state, transient UI state.
- **`ref` in a component** — state that lives and dies with the component.

### Store conventions

- Use the **setup-store syntax** (matches Composition API style):

```ts
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AudienceType } from '@/modules/signup/types/AudienceType'

export const useAuthStore = defineStore('auth', () => {
  const userType = ref<AudienceType | null>(null)

  const isAuthenticated = computed(() => userType.value !== null)

  function loginAs(type: AudienceType) {
    userType.value = type
  }

  function logout() {
    userType.value = null
  }

  return { userType, isAuthenticated, loginAs, logout }
}, {
  persist: true,
})
```

- **Naming:** `useXxxStore` (`useAuthStore`, `useClaimsStore`, `useShiftsFilterStore`).
- **Location:** shared stores in `src/stores/`. Feature-specific stores in `src/modules/<feature>/stores/`.
- **Persistence:** add `{ persist: true }` for any store whose state should survive reload (auth, claims). Omit for transient stores (e.g., a filter UI).
- **Actions are typed.** No untyped action arguments.
- **Selectors are computed.** Don't recompute derived state in components — expose it from the store as a `computed`.

### Persisted state cautions

- Persisted stores are **synced to `localStorage`**. Do not store secrets, tokens, or PII there.
- If you change a store's shape (e.g., add a required field), users with old persisted state will load stale data. Use a `version` key + migration if this comes up.

## Forms

Forms are the most logic-heavy part of any app. To keep components clean, we follow the **Service Layer pattern** (a.k.a. "thin components" / "headless logic"). The architecture is:

```
LoginForm.vue            ← presentational only (template + bindings)
   └─ useLoginForm.ts    ← composable: reactive state, glue
      └─ LoginForm.ts    ← service: pure functions (validate, submit, transform)
         └─ types/       ← interfaces (LoginFormValues, LoginFormErrors)
            enums/       ← any related enums
```

**Roles:**

- **The `.vue` component** holds the template, bindings (`v-model`, event handlers), and *nothing else*. No validation logic, no `if/else` branching on field rules, no API calls. If you find yourself writing `if (email.includes('@'))` in a `.vue` file, stop — that belongs in the service.
- **The composable (`useLoginForm.ts`)** wraps reactive state (`values`, `errors`, `touched`, `status`) and exposes a clean API: `submit()`, `setField(name, value)`, `reset()`. It calls into the service for validation and submission.
- **The service (`LoginForm.ts`)** holds pure functions: `validateLoginForm(values): LoginFormErrors`, `submitLoginForm(values): Promise<Result>`. No Vue imports. No reactivity. Just inputs → outputs. This is what makes it unit-testable.
- **The types** live in `types/` and are imported by all three layers.

### Why this pattern

- **Components stay small and readable.** A reviewer can grok the UI without scrolling through 200 lines of validation.
- **Logic is testable.** Pure functions in services are trivial to test — no DOM, no Vue runtime needed.
- **Logic is reusable.** Two views can use the same service; only the composable wiring differs.
- **Easier to swap UI libraries** later — the logic doesn't move.

### Naming

For a feature called `login`:

| Layer | File | Path |
|---|---|---|
| Types | `LoginForm.ts` | `src/modules/login/types/LoginForm.ts` |
| Service | `LoginForm.ts` | `src/modules/login/services/LoginForm.ts` |
| Composable | `useLoginForm.ts` | `src/modules/login/composables/useLoginForm.ts` (or shared if generic) |
| View | `LoginView.vue` | `src/modules/login/views/LoginView.vue` |
| Component | `LoginForm.vue` | `src/modules/login/components/LoginForm.vue` |

The service file and the types file can share a name (`LoginForm.ts`) because they live in different folders (`services/` vs `types/`). The composable is `useXxxForm`.

### Example skeleton

```ts
// src/modules/login/types/LoginForm.ts
export interface LoginFormValues {
  email: string
  password: string
}

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>

export type LoginFormStatus = 'idle' | 'submitting' | 'error' | 'success'
```

```ts
// src/modules/login/services/LoginForm.ts
import type { LoginFormValues, LoginFormErrors } from '../types/LoginForm'

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {}
  if (!values.email.includes('@')) errors.email = 'Enter a valid email'
  if (values.password.length < 8) errors.password = 'Min 8 characters'
  return errors
}

export async function submitLoginForm(values: LoginFormValues): Promise<void> {
  // mock submission
  console.log('Login submitted', values)
}
```

```ts
// src/modules/login/composables/useLoginForm.ts
import { reactive, ref } from 'vue'
import type { LoginFormValues, LoginFormErrors, LoginFormStatus } from '../types/LoginForm'
import { validateLoginForm, submitLoginForm } from '../services/LoginForm'

export function useLoginForm() {
  const values = reactive<LoginFormValues>({ email: '', password: '' })
  const errors = ref<LoginFormErrors>({})
  const status = ref<LoginFormStatus>('idle')

  async function submit() {
    errors.value = validateLoginForm(values)
    if (Object.keys(errors.value).length > 0) return
    status.value = 'submitting'
    try {
      await submitLoginForm(values)
      status.value = 'success'
    } catch {
      status.value = 'error'
    }
  }

  return { values, errors, status, submit }
}
```

```vue
<!-- src/modules/login/components/LoginForm.vue -->
<script setup lang="ts">
import { useLoginForm } from '../composables/useLoginForm'
const { values, errors, status, submit } = useLoginForm()
</script>

<template>
  <form @submit.prevent="submit">
    <input v-model="values.email" type="email" />
    <p v-if="errors.email">{{ errors.email }}</p>
    <input v-model="values.password" type="password" />
    <p v-if="errors.password">{{ errors.password }}</p>
    <button :disabled="status === 'submitting'">Sign in</button>
  </form>
</template>
```

### Hard rules

- **No validation logic in `.vue` files.** It goes in the service.
- **No `fetch`, `axios`, or API calls in `.vue` files.** They go in the service.
- **No types defined inline in `.vue` files** beyond trivial component-local props. Form types live in `types/`.
- **The composable does not contain business rules.** It manages reactive state and calls the service.

## What NOT to do

- Don't store secrets or PII in Pinia persisted state — it lives in `localStorage` and is readable by any script on the page.
- Don't reach for Pinia for transient component-local state — use `ref` or a composable instead.
- Don't add a UI library beyond shadcn-vue (no Vuetify, PrimeVue, Element Plus).
- Don't reach for SSR. This is an SPA.
- Don't put feature-specific logic in `src/components/` or `src/helpers/`.
- Don't skip the model-first step.
