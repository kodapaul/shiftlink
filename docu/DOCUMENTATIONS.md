# DOCUMENTATIONS

Per-module + per-feature index. Update this when you add a new module, change a contract, or override a shadcn component.

## Module template

```markdown
## <Module Name>

Path: src/modules/<module>/
Routes: /path1, /path2
Status: stub | in-progress | complete

### Purpose
One paragraph: what this module does and which user it serves.

### Models / Services / Composables / Components / Views
Bullets per layer.

### Notes
Tradeoffs, gotchas, future work.
```

---

## Modules

### user (domain module)

Path: `src/modules/user/`
Status: complete

#### Purpose
Auth-focused identity domain. Owns the base `User` type and the `UserType` enum that drives auth state, route guards, signup branching, and entity discriminators.

#### Models
- `User` — base shape with `id`, `type: UserType`, `email`, `name`, `phone?`, `createdAt`
- `UserType` (enum) — `'professional' | 'facility_staff'`

---

### professional (domain module)

Path: `src/modules/professional/`
Status: types complete; no UI yet (Phase B will add `/shifts*`)

#### Models
- `Professional extends User` — `type: 'professional'`, `role` (enum), `certifications`, `yearsExperience`, `preferredLocations`
- `Role` (enum) — RegisteredNurse, EnrolledNurse, AssistantInNursing, Carer, Midwife (+ `ROLE_LABELS`, `ROLE_SHORT_LABELS`)

#### Notes
The `Role` enum is still used by Professional. Shifts no longer use this enum — `Shift.role` is free-text since the post-shift form lets facilities type any title.

---

### facility (domain + feature module)

Path: `src/modules/facility/`
Routes: `/facility`, `/facility/shifts/new`, `/facility/shifts/:id`, `/facility/shifts/:id/edit`, `/facility/applications`, `/facility/map`
Status: complete (signup/login/onboarding pending in Phase A)

#### Purpose
Facility-side admin portal where facility staff post and manage shifts, triage applications, and view shifts on a map.

#### Models
- `Facility` — the org (`id`, `name`, `type`, `location`, `phone`, `email`)
- `FacilityStaff extends User` — `type: 'facility_staff'`, `facilityId`, `position`
- `FacilityType` (enum) — Hospital, AgedCare, MentalHealth, Clinic, CommunityHealth, Hospice
- `StaffPosition` (enum) — NurseManager, ChargeNurse, RosterCoordinator, HRStaff, Administrator
- `PostShiftFormValues`, `PostShiftFormErrors`, `PostShiftFormStatus` — post/edit form state

#### Services
- `validatePostShiftForm(values)` — pure validation
- `buildShiftDraft(values, postedByStaffId)` — casts form values into a `Shift` draft (no `facilityId` since single-facility model)
- `deriveShiftType(startTime)` — classifies a shift as day/evening/night based on its start hour. Lets us drop the explicit shift-type field from the form.
- `emptyPostShiftForm()` — initial form values

#### Composables
- `usePostShiftForm({ editingShiftId? })` — reactive form state. Edit mode: hydrates from the existing shift, submit calls `useShiftsStore.update()` instead of `create()`. Returns typed `ComputedRef`s.

#### Components
- `FacilitySidebar.vue` — forest-green sidebar (shadcn-vue Sidebar). Nav: All posted shifts · Post a shift · Applications · Shift map. Pending-applications badge on Applications entry.
- `PostedShiftCard.vue` — clickable card that navigates to `/facility/shifts/:id`. Shows status pill, role, date/time/rate, location, applicant count badge (or "Claimed by X" pill for claimed shifts), Edit/Delete buttons (with `@click.stop`).
- `PostShiftForm.vue` — the post/edit form. Free-text Role, optional Location, DatePicker, two TimePickers, hourly rate, urgency toggle, RichTextEditor for notes.
- `ShiftStatusBadge.vue` — status pill: sage = open, blush = urgent+open, mist on ink = claimed.
- `ShiftOverviewPanel.vue` — read-only shift summary on the detail page Overview tab.
- `ShiftApplicationsPanel.vue` — applicants list on the detail page Applications tab.

#### Views
- `FacilityLayoutView.vue` — wraps SidebarProvider + FacilitySidebar + SidebarInset + RouterView. Hydrates shifts and applications stores. Auto-impersonates demo facility staff if not signed in (will be replaced in Phase A by a real login redirect).
- `FacilityDashboardView.vue` — main list at `/facility`. Search + status tabs (Open / Claimed / All). Empty / no-match states.
- `PostShiftView.vue` — page wrapper for the create form.
- `EditShiftView.vue` — page wrapper for the edit form. Pre-populates via the composable's `editingShiftId` option. Falls back to "Shift not found" if id is invalid.
- `ShiftDetailView.vue` — `/facility/shifts/:id` with shadcn-vue Tabs (Overview · Applications). Default tab is Applications when there are pending applications. Edit + Delete buttons in the header.
- `ApplicationsView.vue` — `/facility/applications` cross-shift triage. Search + status tabs (Pending / Accepted / Declined / All).
- `ShiftMapView.vue` — `/facility/map`. Split list-on-left + Leaflet-map-on-right with click-to-fly via `selectedId` prop.

---

### shifts (domain module)

Path: `src/modules/shifts/`
Status: complete

#### Models
- `Shift` — `id`, `postedByStaffId`, `role` (free-text string), `date`, `startTime`, `endTime`, `hourlyRate`, `shiftType`, `status`, `urgency`, optional `location`, optional `lat`/`lng`, optional `notes` (HTML string), `createdAt`, optional `claimedByProfessionalId`/`claimedAt`
- `ShiftStatus` enum — `'open' | 'claimed'`
- `Urgency` enum — `'standard' | 'urgent'`
- `ShiftType` enum — `'day' | 'evening' | 'night'`

#### Notes
Single-facility model: shifts have no `facilityId` field — they implicitly belong to the one facility in the prototype. `lat`/`lng` are optional; the seeded shifts all have them (Sydney suburbs with ±0.005° jitter), user-posted shifts currently don't (could be added via geocoding the `location` string later).

---

### applications (domain module)

Path: `src/modules/applications/`
Status: complete

#### Purpose
Models the relationship between professionals and shifts. A professional applies to a shift; the facility staff accepts one applicant (which auto-claims the shift) or declines applicants.

#### Models
- `ShiftApplication` — `id`, `shiftId`, `professionalId`, `status: ApplicationStatus`, `appliedAt`, optional `message`, optional `decidedAt`/`decidedByStaffId`
- `ApplicationStatus` (enum) — `'pending' | 'accepted' | 'declined'` (+ `APPLICATION_STATUS_LABELS`)

#### Services (pure)
- `applicationsForShift(apps, shiftId)`
- `pendingApplicationsForShift(apps, shiftId)`
- `pendingCountForShift(apps, shiftId)`
- `acceptedApplicationForShift(apps, shiftId)`
- `groupByShiftId(apps)`
- `sortForReview(apps)` — pending first (newest first), then accepted, then declined

#### Composables
- `useShiftApplications(shiftId)` — per-shift reactive view. Returns `applications`, `pendingApplications`, `acceptedApplication`, `declinedApplications`, `pendingCount`, `hasPending`, `accept`, `decline`. The `accept`/`decline` methods resolve `decidedByStaffId` from auth.
- `useFacilityApplications()` — cross-shift triage. Returns `filter` (Pending/Accepted/Declined/All), `searchQuery`, `rows` (joined with shifts + professionals, sorted), counts per status, `accept`, `decline`.

#### Components
- `ApplicationStatusBadge.vue` — pending (sage) / accepted (marigold) / declined (mist) pill
- `ApplicationCountBadge.vue` — "N applicants" pill on shift cards
- `ClaimedByBadge.vue` — "Claimed by [name]" pill on claimed shift cards
- `ApplicantRow.vue` — single applicant in a list. Optional `shift` prop renders shift-context chip (used in cross-shift view)

#### Notes
Cross-store mutation lives in `useApplicationsStore.accept()` — see store entry below.

---

## Shared stores

Pinia stores in `src/stores/` consumed across modules.

### useAuthStore (`src/stores/auth.ts`)

Dummy authentication, persisted to `localStorage`.

- State: `userType: UserType | null`, `userId: string | null`, `facilityId: string | null`
- Getters: `isAuthenticated`, `isFacilityStaff`, `isProfessional`, `currentFacilityStaff`, `currentProfessional`
- Actions: `loginAsProfessional(id?)`, `loginAsFacility(id?)`, `logout()`

The `loginAs*` actions look up the demo user from seed JSON. If `id` is omitted they pick the first record (the canonical demo account).

Will be replaced by real signup/login in Phase A.

---

### useShiftsStore (`src/stores/shifts.ts`)

Source of truth for all shifts. Hydrates from `src/data/shifts.json` on first load. Persisted.

- State: `shifts: Shift[]`
- Getters: `openShifts` (status === 'open', sorted by date), `sortedShifts` (all, sorted by date)
- Actions: `hydrateIfEmpty()`, `resetToSeed()`, `getById(id)`, `create(input)`, `update(id, partial)`, `remove(id)`, `sanitizeRoles()`

`sanitizeRoles()` is a one-time data migration that converts any legacy snake_case role values (e.g. `'registered_nurse'`) to Title Case in-place. Runs on every hydrate but is idempotent.

> Type-checker note: the `persist: true` option is cast as `Record<string, unknown>` because pinia-plugin-persistedstate's `S extends StateTree` augmentation doesn't narrow correctly under pinia@3 + Vue 3.5 + plugin@4.7. Runtime is fine.

---

### useApplicationsStore (`src/stores/applications.ts`)

Source of truth for all applications. Hydrates from `src/data/applications.json` on first load. Persisted.

- State: `applications: ShiftApplication[]`
- Getter: `pendingTotal`
- Actions: `hydrateIfEmpty()`, `resetToSeed()`, `getById(id)`, `apply(input)`, `accept(id, decidedByStaffId)`, `decline(id, decidedByStaffId)`, `remove(id?)`

#### Cross-store side effect on accept

`accept()`:
1. Marks the application as accepted with `decidedAt` + `decidedByStaffId`
2. Calls `useShiftsStore.update()` to flip the linked Shift's status to `'claimed'` and set `claimedByProfessionalId` + `claimedAt`
3. Auto-declines all other pending applications for the same shift

Keeping this in the store (not in components) means consumer components stay dumb and the policy lives in one place.

---

## Shared helpers

### format.ts (`src/helpers/format.ts`)

Pure formatters, no Vue dependency.

- `formatShiftDate(iso)` — "Thu 14 May" (year omitted if current year)
- `formatTime12h(time24)` — converts 24-hour `'HH:mm'` to 12-hour `'h:mm AM/PM'`
- `formatShiftTimes(start, end)` — "7:00 AM – 3:00 PM"
- `formatRate(amount)` — "$68/hr"
- `formatRelativeDate(iso)` — "Today" / "Tomorrow" / "in 5 days" / "2 days ago"
- `formatTimeAgo(iso)` — "just now" / "5m ago" / "3h ago" / "2d ago"

---

## Shared components (`src/components/`)

### TimePicker.vue

Custom 12-hour time picker with AM/PM. Built on shadcn-vue Popover + themed Button. Three columns inside the popover: Hour (01–12), Min (configurable step, default 1), Period (AM/PM). Auto-scrolls active items into view on open.

Public API: `v-model` is a 24-hour `'HH:mm'` string. Internal display is 12-hour. Used in PostShiftForm for Start / End time fields.

### ShiftMap.vue

Reusable Leaflet map. Renders pins per shift (sage = open, blush = urgent+open, mist = claimed). Pin colors driven by brand CSS variables. Tile provider: CartoDB Voyager (no API key). Themed popup matching cream/bone surfaces.

Props: `shifts`, `center?`, `zoom?`, `selectedId?`, `selectedZoom?`. When `selectedId` changes, map flies to that pin and opens its popup. Emits `select` when a pin is clicked, so the parent can update its highlighted item.

Used in `ShiftMapView.vue`. Reusable elsewhere — e.g. shift detail page could use it to show one pin.

### RichTextEditor.vue

Tiptap-backed WYSIWYG. Toolbar: Bold, Italic, H2, H3, Bullet list, Ordered list, Link. Public model is an HTML string so it round-trips through Pinia + JSON unchanged.

Coerces empty content (`<p></p>`) to `''` so form emptiness checks keep working. Edit-mode hydration via watch on `modelValue`.

Used in PostShiftForm for the Notes field.

### RichTextRenderer.vue

Safely renders HTML produced by RichTextEditor. Sanitizes via DOMPurify with a strict allowlist (`p, h2, h3, strong, em, ul, ol, li, a, br`) before `v-html`. Same `.rte-prose` styles as the editor body so editor output and rendered output look identical.

Used in PostedShiftCard and ShiftOverviewPanel for displaying shift notes.

---

## Component overrides

shadcn-vue components customized away from defaults. Don't revert these.

### Button (`src/components/ui/button/index.ts`)

- Added `cursor-pointer` to base classes (Tailwind v4 doesn't apply pointer cursor by default; shadcn-vue default doesn't either)
- Added `disabled:cursor-not-allowed`

### SelectContent (`src/components/ui/select/SelectContent.vue`)

Defaults changed so dropdowns anchor below the trigger:
- `position: 'popper'` (was `'item-aligned'`)
- `side: 'bottom'`
- `sideOffset: 6`
- `align: 'start'`

### Sidebar CSS variables (`src/assets/main.css`)

Sidebar runs forest-green with cream type, marigold accents. Two custom tokens (`--forest-tint-1`, `--forest-tint-2`) for hover backgrounds and borders that need to be visible against the deep base.

- `--sidebar` → `var(--forest)`
- `--sidebar-foreground` → `var(--cream)`
- `--sidebar-primary` → `var(--marigold)`
- `--sidebar-primary-foreground` → `var(--ink)`
- `--sidebar-accent` → `var(--forest-tint-1)` (hover)
- `--sidebar-accent-foreground` → `var(--cream)`
- `--sidebar-border` → `var(--forest-tint-2)`

---

## Mock data (`src/data/`)

Hand-curated JSON, regenerated where indicated by the script in `scripts/`.

| File | Records | How to regen | Consumed by |
|---|---|---|---|
| `facilities.json` | 1 facility (St. Vincent's Aged Care, Bondi) | hand-edited | `useAuthStore`, `FacilitySidebar`, `EditShiftView`, etc. |
| `facilityStaff.json` | 5 staff (Sarah, David, Priya, Tom, Linda) all under fac_001 | hand-edited | `useAuthStore.loginAsFacility(id)` |
| `professionals.json` | 10 (RN/EN/AIN/Carer/Midwife mix) | hand-edited | `useAuthStore`, `ApplicantRow`, `ClaimedByBadge` |
| `shifts.json` | 121 (varied roles, dates, locations, lat/lng, statuses) | `npm run data:shifts` | `useShiftsStore` |
| `applications.json` | ~265 (1 accepted per claimed shift, 1–5 pending per open shift) | `npm run data:applications` | `useApplicationsStore` |

`npm run data:all` regenerates shifts then applications in order (the second references shift ids).
