# DOCUMENTATIONS

Per-feature and per-module documentation index. Update this file when you add a new module, change a contract, or override a shadcn component.

## How to document a feature

Each module gets a section below using this template:

```markdown
## <Module Name>

**Path:** `src/modules/<module>/`
**Routes:** `/path1`, `/path2`
**Status:** stub | in-progress | complete

### Purpose
One paragraph: what this module does and which user it serves.

### Models
List the core types/interfaces (link to the file in `types/`).

### Services
List the public functions in `services/` and what they do.

### Composables
List composables this module exposes and what they manage.

### Components
List notable components (especially ones promoted to `src/components/`).

### Notes
Tradeoffs, gotchas, future work.
```

---

## Modules

### User (domain module)

**Path:** `src/modules/user/`
**Routes:** none — types/enums only
**Status:** complete

#### Purpose
Auth-focused identity domain. Owns the base `User` type and the `UserType` enum that drives auth state, route guards, signup branching, and entity discriminators.

#### Models
- `User` — base shape, has `type: UserType` discriminator
- `UserType` (enum) — `'professional' | 'facility_staff'`

---

### Professional (domain module)

**Path:** `src/modules/professional/`
**Routes:** none yet (Phase 6 will add `/shifts*`)
**Status:** types complete

#### Models
- `Professional extends User` — `type: 'professional'`, `role`, `certifications`, `yearsExperience`, `preferredLocations`
- `Role` (enum) — RegisteredNurse, EnrolledNurse, AssistantInNursing, Carer, Midwife (+ `ROLE_LABELS`, `ROLE_SHORT_LABELS`)

---

### Facility (domain + feature module)

**Path:** `src/modules/facility/`
**Routes:** `/facility`, `/facility/shifts/new`
**Status:** complete

#### Purpose
Facility-side admin portal where facility staff post and manage shifts. Owns the `Facility` and `FacilityStaff` entities plus their enums.

#### Models
- `Facility` — the org (id, name, type, location, …)
- `FacilityStaff extends User` — `type: 'facility_staff'`, `facilityId`, `position`
- `FacilityType` (enum) — Hospital, AgedCare, MentalHealth, Clinic, CommunityHealth, Hospice
- `StaffPosition` (enum) — NurseManager, ChargeNurse, RosterCoordinator, HRStaff, Administrator
- `PostShiftFormValues`, `PostShiftFormErrors`, `PostShiftFormStatus` — form state

#### Services
- `validatePostShiftForm(values)` — pure validation, returns errors object
- `buildShiftDraft(values, facilityId, staffId)` — casts form values into a `Shift` draft (no id/createdAt/status)
- `defaultTimesForShiftType(type)` — suggested 07:00–15:00 / 15:00–23:00 / 23:00–07:00
- `emptyPostShiftForm()` — initial form values

#### Composables
- `usePostShiftForm()` — reactive `values`/`errors`/`status` + `setField`, `applyShiftTypeDefaults`, `submit`, `reset`. Wires the service to `useShiftsStore.create()` and `useAuthStore.facilityId/userId`.

#### Components
- `FacilitySidebar.vue` — forest-green shadcn-vue sidebar with brand mark, nav, "At a glance" stats, identity card footer
- `PostedShiftCard.vue` — shift list item (status pill, role title, date/time/rate, posted-ago, delete CTA)
- `PostShiftForm.vue` — the actual form (uses shadcn-vue Input, Label, Select, Textarea)
- `ShiftStatusBadge.vue` — pill: sage for open, blush for urgent+open, mist on ink for claimed

#### Views
- `FacilityLayoutView.vue` — wraps `<SidebarProvider>` + `<FacilitySidebar>` + `<SidebarInset>` + `<RouterView />`. Auto-impersonates the demo facility staff if not signed in.
- `FacilityDashboardView.vue` — main dashboard (greeting, stats, filter tabs, posted-shift list, delete dialog)
- `PostShiftView.vue` — page wrapper for the post-shift form

#### Notes
- The dashboard auto-logs-in as Sarah Whitfield (`fs_001`, St. Vincent's Aged Care) on first visit if no auth state exists, so the prototype is browseable without the not-yet-built signup flow.
- Status pill colours follow BRAND.md: sage = open, blush = urgent+open, mist on ink = claimed.
- Delete uses shadcn-vue `Dialog` (confirmation modal) — soft delete is not supported, only hard delete from the store.

---

### Shifts (domain module)

**Path:** `src/modules/shifts/`
**Routes:** Phase 6 will add `/shifts*`
**Status:** types/enums + seed data complete

#### Models
- `Shift` — facilityId, postedByStaffId, role, date, startTime, endTime, hourlyRate, shiftType, status, urgency, optional notes, optional claim fields
- `ShiftStatus` enum — `'open' | 'claimed'`
- `Urgency` enum — `'standard' | 'urgent'`
- `ShiftType` enum — `'day' | 'evening' | 'night'`

<!--
Example entry — replace when the landing module is built:

## Landing

**Path:** `src/modules/landing/`
**Routes:** `/`
**Status:** complete

### Purpose
Public-facing marketing page presenting ShiftLink to two audiences (healthcare professionals and facilities) with a dual-CTA pattern.

### Models
- `AudienceType` (enum) — `'professional' | 'facility'`
- `TrustSignal` (interface) — shape for stats/badges in the trust row

### Services
None — landing page is static content from `src/data/landing.ts`.

### Composables
None.

### Components
- `HeroDualCta.vue` — hero section with two parallel CTAs
- `AudienceSection.vue` — reusable, takes audience-specific copy as props
- `TrustRow.vue` — facility logo wall + stat numbers

### Notes
Hero headline uses Fraunces at `text-display`. CTAs link to `/signup?type=<audience>` to pre-select the audience in the signup form.
-->

## Component overrides

Document any shadcn-vue component that has been customized away from defaults so future agents do not revert the changes.

### Button (`src/components/ui/button/index.ts`)

- Added `cursor-pointer` to the base classes so buttons show a pointer (finger) cursor on hover. Tailwind v4 does not apply `cursor: pointer` to `<button>` by default, and the shadcn-vue default doesn't either.
- Added `disabled:cursor-not-allowed` so disabled buttons show the standard not-allowed cursor instead of the pointer.

### SelectContent (`src/components/ui/select/SelectContent.vue`)

Changed defaults so dropdowns anchor below the trigger instead of overlaying it (Reka UI's `item-aligned` default aligns the selected item with the trigger, which hides the trigger button).

- `position: 'popper'` (was `'item-aligned'`)
- `side: 'bottom'`
- `sideOffset: 6`
- `align: 'start'` (was `'center'`)

### Sidebar CSS variables (`src/assets/main.css`)

Sidebar runs in **forest green with cream type**, not the default shadcn slate. Two custom tokens (`--forest-tint-1`, `--forest-tint-2`) are slightly lighter forest shades used for hover backgrounds, borders, and dividers that need to be visible against the deep base.

- `--sidebar` → `var(--forest)`
- `--sidebar-foreground` → `var(--cream)`
- `--sidebar-primary` → `var(--marigold)` (used for active nav item bg)
- `--sidebar-primary-foreground` → `var(--ink)`
- `--sidebar-accent` → `var(--forest-tint-1)` (hover)
- `--sidebar-accent-foreground` → `var(--cream)`
- `--sidebar-border` → `var(--forest-tint-2)`

## Shared stores

Document Pinia stores in `src/stores/` that multiple modules depend on.

### useAuthStore (`src/stores/auth.ts`)

Dummy authentication, persisted to `localStorage` via `pinia-plugin-persistedstate`.

- State: `userType: UserType | null`, `userId: string | null`, `facilityId: string | null`
- Getters: `isAuthenticated`, `isFacilityStaff`, `isProfessional`, `currentFacilityStaff`, `currentProfessional`
- Actions: `loginAsProfessional(id?)`, `loginAsFacility(id?)`, `logout()`

The `loginAs*` actions look up the demo user from `src/data/professionals.json` / `facilityStaff.json`. If `id` is omitted they pick the first record (the canonical demo account).

Used by: route guards, `FacilityLayoutView`, `FacilitySidebar`, `usePostShiftForm`.

---

### useShiftsStore (`src/stores/shifts.ts`)

Source of truth for all shifts in the prototype, persisted to `localStorage`.

- State: `shifts: Shift[]`
- Getters: `openShifts`
- Actions: `hydrateIfEmpty()`, `resetToSeed()`, `getById(id)`, `create(input)`, `remove(id)`, `shiftsForFacility(facilityId)`

Hydrates from `src/data/shifts.json` on first load if state is empty (called from `App.vue` `onMounted` and `FacilityDashboardView`). After hydration, all CRUD goes through the store and persists.

> Type-checker note: the `persist: true` option is cast as `Record<string, unknown>` because pinia-plugin-persistedstate's `S extends StateTree` augmentation doesn't narrow correctly under pinia@3 + Vue 3.5 + plugin@4.7 when actions return non-void types. Runtime is fine. Search the file for "persist" to find the cast and the comment explaining it.

---

## Shared helpers

### format.ts (`src/helpers/format.ts`)

Pure formatters with no Vue dependency.

- `formatShiftDate(iso)` — "Thu 14 May" (year omitted if current year)
- `formatShiftTimes(start, end)` — "07:00 – 15:00"
- `formatRate(amount)` — "$68/hr"
- `formatRelativeDate(iso)` — "Today", "Tomorrow", "in 5 days", "2 days ago"
- `formatTimeAgo(iso)` — "just now", "5m ago", "3h ago", "2d ago"

---

## Shared composables

Document composables in `src/composables/` that multiple modules depend on.

> No shared composables yet — module-local composables (e.g. `usePostShiftForm`) live inside their feature module.

<!--
Example:

### useAuth (`src/composables/useAuth.ts`)
Manages the dummy "logged in" state via localStorage.

- `userType: Ref<'professional' | 'facility' | null>`
- `loginAs(type)` — sets userType and persists to localStorage
- `logout()` — clears userType and localStorage
- `isAuthenticated: ComputedRef<boolean>`

Used by: route guard in `src/router/index.ts`, NavBar component.
-->

## Mock data

Document what's in `src/data/` so future agents know the shape and where it's consumed.

> No mock data files yet.

<!--
Example:

### shifts.ts (`src/data/shifts.ts`)
Exports `mockShifts: Shift[]` — array of ~20 hardcoded shifts with varied roles, facilities, dates, and rates.

Consumed by:
- `src/modules/shifts/services/shiftService.ts` for listing and filtering
- Demo data only — not editable at runtime
-->
