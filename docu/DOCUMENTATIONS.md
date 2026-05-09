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

### user (domain + auth-flow module)

Path: `src/modules/user/`
Routes: `/staff/login`, `/staff/registration`, `/staff/onboarding`, `/login`, `/register`
Status: complete

> URL convention: the professional side gets the "primary" unprefixed URLs (`/login`, `/register`) since they're the larger audience; staff auth is namespaced under `/staff/...` to match `/facility/...`. Inside the module, the file names still use the audience prefix (`Professional…`, `Staff…`) — only the URLs differ from the file names.

#### Purpose
Auth-focused identity domain plus all the auth-flow UI that depends on it. Owns the base `User` type and `UserType` enum that drive auth state and route guards, and houses the login / registration / onboarding flows for both audiences. Layout is **flat** — files live directly under standard folders (`types/`, `enums/`, `services/`, `composables/`, `components/`, `views/`) and are named with an audience prefix (`Staff…`, `Professional…`) so everything stays in one module without sub-folders.

#### Models
- `User` — base shape with `id`, `type: UserType`, `email`, `name`, `phone?`, `createdAt`
- `UserType` (enum) — `'professional' | 'facility_staff'`
- `StaffLoginForm` types — `Values`, `Errors`, `Status`
- `StaffRegistrationForm` types — `Values` (staff fields + password only — no facility inputs), `Errors`, `Status`
- `ProfessionalLoginForm` types — `Values`, `Errors`, `Status`
- `ProfessionalRegistrationForm` types — `Values` (name, email, phone, role, yearsExperience, password), `Errors`, `Status`
- `OnboardingStep` (enum) — `'welcome' | 'facility' | 'invite' | 'done'` (+ `ONBOARDING_STEP_LABELS`, `ONBOARDING_STEP_ORDER`). Staff-only — professionals don't have an onboarding wizard.

#### Services
- `StaffLoginForm.ts` — `validateStaffLoginForm`, `submitStaffLoginForm` (returns a `StaffLoginResult` discriminated union; resolves the staff record by email via callback so the auth store stays the single source of truth)
- `StaffRegistrationForm.ts` — `validateStaffRegistrationForm` (checks for email collisions vs. seed + already-created staff), `buildStaffFromForm`, exported `SINGLE_FACILITY_ID` constant pulled from the seed (every registration is bound to it)
- `ProfessionalLoginForm.ts` — `validateProfessionalLoginForm`, `submitProfessionalLoginForm` (returns a `ProfessionalLoginResult` discriminated union)
- `ProfessionalRegistrationForm.ts` — `validateProfessionalRegistrationForm` (email collisions across seed + created), `buildProfessionalFromForm`

#### Composables
- `useStaffLoginForm()` — reactive form state. On success calls `auth.loginAsFacility(staffId)` and routes to `/staff/onboarding` (first-time) or `/facility` (returning)
- `useStaffRegistrationForm()` — reactive form state. On success calls `auth.signUpAsFacility({ staff })` and routes to `/staff/onboarding`
- `useOnboarding()` — step state machine (`current`, `next`, `back`, `goTo`, `complete`)
- `useProfessionalLoginForm()` — reactive form state. On success calls `auth.loginAsProfessional(id)` and routes to `/professional`. No onboarding branch — professionals skip it entirely.
- `useProfessionalRegistrationForm()` — reactive form state. On success calls `auth.signUpAsProfessional({ professional })` and routes to `/professional`.

#### Components
- `StaffLoginForm.vue` — presentational. Email + password.
- `StaffRegistrationForm.vue` — presentational. Three sections: read-only facility info card, you, password.
- `OnboardingStepper.vue` — numbered pill stepper. Reusable for any future multi-step flow.
- `ProfessionalLoginForm.vue` — presentational. Email + password. Mirrors `StaffLoginForm.vue`.
- `ProfessionalRegistrationForm.vue` — presentational. Two sections: about you (name, email, phone, role, years experience), password.

#### Views
- `StaffLoginView.vue` at `/staff/login` — two-pane editorial layout. **Left:** rounded `forest-deep` card sitting on the cream page with a `lg:p-6` gutter; uses an explicit grid (`grid-rows-[auto_minmax(0,1fr)_auto]`) so the wordmark, illustration+copy block, and tagline never collide on short viewports. The card is `overflow-hidden` and never scrolls. **Right:** plain cream column, `lg:h-dvh lg:overflow-y-auto` — this is the scrollable element on desktop. Includes a small "demo accounts" panel listing the seeded staff emails (mock auth accepts any 6+ char password). Imports `auth-login.png` from `src/assets/illustrations/`.
- `StaffRegistrationView.vue` at `/staff/registration` — same two-pane frame and same scroll behaviour as login. Imports `auth-registration.png`.
- `StaffOnboardingView.vue` at `/staff/onboarding` — 4-step wizard (welcome → read-only facility confirmation → invite staff stub → done). Centered single-column layout, no two-pane.
- `ProfessionalLoginView.vue` at `/login` — same two-pane frame as the staff equivalent (`forest-deep` card on the left, scrollable form on the right). Demo accounts panel lists the seeded professionals with their role short-label (RN / EN / AIN / Carer / Midwife) for quick visual triage. Cross-audience footer link to `/staff/login` for misclicks. **No illustration yet** — slot is documented in the file's leading comment for when a paired professional illustration is generated.
- `ProfessionalRegistrationView.vue` at `/register` — same two-pane frame. Cross-audience footer link to `/staff/registration`. **No illustration yet.**

#### Notes
The `user/` module is intentionally cross-audience: per CONFIGURATIONS.md, identity-and-auth-flow concerns live here even when they touch a specific user kind. Audience-specific *entity* fields still live in their owner module (`Professional` in `professional/`, `FacilityStaff` in `facility/`).

Professionals do not have an onboarding step — staff have it because there's a facility to confirm; professionals have nothing analogous to set up. Post-signup routes straight to `/shifts`.

---

### professional (domain + feature module)

Path: `src/modules/professional/`
Routes: `/professional` (three-tab dashboard: Profile · Applications · Schedule), `/professional/edit` (dedicated profile edit page)
Status: complete (browse + claim UI is the next milestone — see Phase B in TODOS.md)

#### Models
- `Professional extends User` — full identity-and-clinical record. Base fields from `User` (id, type, email, name, phone, createdAt) plus:
  - **Professional/clinical:** `role` (enum), `ahpraNumber?`, `yearsExperience?`, `lastClinicalPractice?` (ISO date), `specialties?: Specialty[]`, `skills?: string[]`, `certifications?: string[]`
  - **Compliance:** `wwcc?: { number, expiry }`, `rightToWork?` (enum), `dateOfBirth?` (ISO date — internal only, not displayed to facilities)
  - **Preferences:** `preferredLocations?: string[]`, `preferredShiftTypes?: ShiftType[]` (reuses the existing enum), `availableFrom?` (ISO date)
  - **Soft profile:** `bio?` (~280 chars), `languages?: string[]`
  - All profile-fill fields are optional on the type — completeness is a runtime check.
- `WorkingWithChildrenCheck` — compound type used by `Professional.wwcc`. Just `{ number, expiry }`.
- `Role` (enum) — RegisteredNurse, EnrolledNurse, AssistantInNursing, Carer, Midwife (+ `ROLE_LABELS`, `ROLE_SHORT_LABELS`)
- `Specialty` (enum) — AcuteCare, AgedCare, Cardiac, Community, Emergency, IntensiveCare, MentalHealth, Maternity, MedicalSurgical, Oncology, Paediatric, Theatre (+ `SPECIALTY_LABELS`)
- `RightToWork` (enum) — Citizen, PermanentResident, VisaHolder (+ `RIGHT_TO_WORK_LABELS`)
- `ProfessionalProfileForm…` types — form values / errors / status / completeness shape used by the Profile tab

#### Services
- `ProfessionalProfileForm.ts` — pure functions:
  - `emptyProfessionalProfileForm()` / `populateProfessionalProfileForm(pro)` — initial / hydrated form values
  - `validateProfessionalProfileForm(values)` — full-pass validation (shape checks for dates, AHPRA pattern, WWCC number+expiry pairing, etc.)
  - `roleRequiresAhpra(role)` — `true` for RN / EN / Midwife, `false` for AIN / Carer. Used both by validation and by the form to conditionally show the AHPRA field.
  - `computeProfileCompleteness(values)` — derives the percentage view used by `ProfileCompletenessBadge`. Required-field set is parameterised by role (AHPRA only counts for RN/EN/Midwife). Completeness only checks presence — format errors are validation's job.
  - `buildProfilePatchFromForm(values)` — translates validated form values into a `Partial<Professional>` patch suitable for `useAuthStore.updateProfessionalProfile`. Empty fields map to `undefined` so they clear rather than persist empty strings.

#### Composables
- `useProfessionalProfileForm()` — reactive form state for the edit page. Hydrates from `auth.currentProfessional` on mount and any time the active professional changes. Exposes `values`, `errors`, `status`, derived `completeness`, plus `hydrate()` and `save()`. `save()` validates → builds the patch → calls `auth.updateProfessionalProfile(patch)` and returns the updated record (or `null` on validation failure). The caller (the edit view) handles routing on success. There's no `isEditing` flag — the URL (`/professional` vs `/professional/edit`) is the source of truth for which mode the user is in.
- `useProfessionalApplications()` — joined view of every application by the active professional with its shift. Filter pills (`pending | accepted | declined | all`) + search across role / location / message. Sorted appliedAt DESC.
- `useProfessionalSchedule()` — accepted-only applications joined with their shifts, grouped into `upcoming` (today onwards) and `past` (most-recent-first). Exposes `nextShift` for hero call-outs.

#### Components
- `ProfileCompletenessBadge.vue` — pill above the form. Sage with check when 100%; marigold-tinted with "X% complete · 7 / 10 required fields · Next: WWCC number" when incomplete.
- `ProfessionalApplicationRow.vue` — read-only application row. Status pill, applied-ago, shift summary (date, time, rate, location), the user's message, and shift notes via `RichTextRenderer`.
- `ProfessionalScheduleRow.vue` — schedule entry styled like a diary entry (large day number, weekday + month). `tone="upcoming" | "past"` controls visual dimming.
- `ProfessionalProfileTab.vue` — **read-only summary** of the profile, sectioned the same way as the edit form (Identity / Professional / Compliance / Preferences / About). The "Edit profile" button is a `RouterLink` to `/professional/edit` — there's no in-place edit mode here.
- `ProfessionalApplicationsTab.vue` — search box + filter pills + list of `ProfessionalApplicationRow`. Empty states differ by filter and search state.
- `ProfessionalScheduleTab.vue` — toggle between **List** and **Calendar** views. List view: hero next-shift call-out, Upcoming and Past sections (each omitted when empty). Calendar view: `CalendarMonth` on the left with marigold/sage dots for upcoming/past shifts, a detail panel on the right showing the selected date's shifts (or an italic "no shifts on this day" hint). Empty state shared across both views when there are no claimed shifts at all.

#### Views
- `ProfessionalHomeView.vue` at `/professional` — renders inside `PublicLayout`. Welcome heading + a shadcn-vue `Tabs` shell with three triggers (Profile · Applications · Schedule). Active tab is component-local state. Hydrates the shifts + applications stores `onBeforeMount` so deep links and fresh loads see the right data.
- `ProfessionalProfileEditView.vue` at `/professional/edit` — dedicated profile edit page. Renders inside `PublicLayout`. Header has a "← Back to dashboard" link, the heading + intro, and the live `ProfileCompletenessBadge`. Body is the five-section form (Identity / Professional / Compliance / Preferences / About) inside `bg-bone` fieldsets. A sticky cream-tinted save bar pinned to `bottom-0` keeps Save / Cancel reachable on long forms. On Save success, routes back to `/professional`. On Cancel, routes back without persisting.

#### Notes
The `Role` enum is still used by Professional. Shifts no longer use this enum — `Shift.role` is free-text since the post-shift form lets facilities type any title.

Authentication for professionals lives in the `user` module (`ProfessionalLoginForm`, `ProfessionalRegistrationForm`, etc.), matching the staff pattern. See the `user` module entry for the full layer breakdown.

Profile edits to seeded professionals are stored as patches in `useAuthStore.professionalProfileOverrides` (a persisted `Record<professionalId, Partial<Professional>>`). The seed JSON stays read-only at runtime; the merged `currentProfessional` / `allProfessionals` getters apply the patch on top. Edits to professionals registered via `signUpAsProfessional` mutate `createdProfessionals[]` in place — no override row needed for them.

---

### facility (domain + feature module)

Path: `src/modules/facility/`
Routes: `/facility`, `/facility/shifts/new`, `/facility/shifts/:id`, `/facility/shifts/:id/edit`, `/facility/applications`, `/facility/map`
Status: complete

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
- `buildShiftDraft(values, postedByStaffId)` — casts form values into a `Shift` draft (no `facilityId` since single-facility model). Doesn't include `lat`/`lng` so edit calls (which pass the partial through `shiftsStore.update`) don't overwrite existing coords.
- `deriveShiftType(startTime)` — classifies a shift as day/evening/night based on its start hour. Lets us drop the explicit shift-type field from the form.
- `randomSydneyCoords()` — picks one of ten predefined Sydney suburb centroids (Bondi, Surry Hills, Manly, Cronulla, etc. — same set as `scripts/generate-shifts.mjs`) and adds ±0.005° jitter (~500m). Used by the **create branch only** of `usePostShiftForm` so newly posted shifts pin on the map without bunching. In a real app, geocoding the `location` string would replace this random pick.
- `emptyPostShiftForm()` — initial form values

#### Composables
- `usePostShiftForm({ editingShiftId? })` — reactive form state. Edit mode: hydrates from the existing shift, submit calls `useShiftsStore.update()` instead of `create()`. Create mode: assigns `randomSydneyCoords()` to the new shift so it pins on the map immediately. Edit mode preserves whatever coords already exist — `buildShiftDraft` doesn't include lat/lng, so the partial update never overwrites them. Returns typed `ComputedRef`s.

#### Components
- `FacilitySidebar.vue` — forest-green sidebar (shadcn-vue Sidebar). Nav: All posted shifts · Post a shift · Applications · Shift map. Pending-applications badge on Applications entry.
- `PostedShiftCard.vue` — clickable card that navigates to `/facility/shifts/:id`. Shows status pill, role, date/time/rate, location, applicant count badge (or "Claimed by X" pill for claimed shifts), Edit/Delete buttons (with `@click.stop`).
- `PostShiftForm.vue` — the post/edit form. Free-text Role, optional Location, DatePicker, two TimePickers, hourly rate, urgency toggle, RichTextEditor for notes.
- `ShiftStatusBadge.vue` — status pill: sage = open, blush = urgent+open, mist on ink = claimed.
- `ShiftOverviewPanel.vue` — read-only shift summary on the detail page Overview tab.
- `ShiftApplicationsPanel.vue` — applicants list on the detail page Applications tab.

#### Views
- `FacilityLayoutView.vue` — wraps SidebarProvider + FacilitySidebar + SidebarInset + RouterView. Hydrates shifts and applications stores. Authentication is enforced by the router guard (unauth visitors redirect to `/staff/login`).
- `FacilityDashboardView.vue` — main list at `/facility`. Search + status tabs (Open / Claimed / All). Empty / no-match states.
- `PostShiftView.vue` — page wrapper for the create form.
- `EditShiftView.vue` — page wrapper for the edit form. Pre-populates via the composable's `editingShiftId` option. Falls back to "Shift not found" if id is invalid.
- `ShiftDetailView.vue` — `/facility/shifts/:id` with shadcn-vue Tabs (Overview · Applications). Default tab is Applications when there are pending applications. Edit + Delete buttons in the header.
- `ApplicationsView.vue` — `/facility/applications` cross-shift triage. Search + status tabs (Pending / Accepted / Declined / All).
- `ShiftMapView.vue` — `/facility/map`. Split list-on-left + Leaflet-map-on-right with click-to-fly via `selectedId` prop. The `lg:h-[70vh] lg:min-h-[520px]` height constraint is scoped to `lg+`; on mobile the grid collapses to a single column with each child taking its own height (`h-[55vh]` list, `h-[60vh] min-h-[420px]` map) so the page scrolls naturally instead of cramming both panels into a fixed box. Map wrapper uses `class="isolate"` so Leaflet's z-indexes don't bleed through the open sidebar drawer on mobile.

---

### shifts (domain + feature module)

Path: `src/modules/shifts/`
Routes: `/shifts` (professional shift browse + apply)
Status: complete

#### Models
- `Shift` — `id`, `postedByStaffId`, `role` (free-text string), `date`, `startTime`, `endTime`, `hourlyRate`, `shiftType`, `status`, `urgency`, optional `location`, optional `lat`/`lng`, optional `notes` (HTML string), `createdAt`, optional `claimedByProfessionalId`/`claimedAt`
- `ShiftStatus` enum — `'open' | 'claimed'`
- `Urgency` enum — `'standard' | 'urgent'`
- `ShiftType` enum — `'day' | 'evening' | 'night'`

#### Services
- `ShiftsBrowse.ts` — pure functions for the browse UX:
  - `filterShifts(shifts, filters)` — search + shift-type + urgent-only filter pipeline. Search is case-insensitive substring match across role / location / HTML-stripped notes.
  - `appliedShiftIdsFor(applications, professionalId)` — Set of shift ids the active pro has applied to (any status). Used to render "Applied" pills.
  - `bestApplicationForShift(applications, shiftId, professionalId)` — picks the strongest application for a given shift (accepted > pending > declined) so the row's pill always reflects the most relevant signal.

#### Composables
- `useShiftsBrowse()` — state + actions for `/shifts`. Owns reactive filter state (`searchQuery`, `shiftTypes` Set, `urgentOnly`), selection state (`selectedId`/`selectedShift` for map+row sync), and the apply gate. Exposes `applyToShift(shiftId, message)` returning a discriminated `ApplyResult` (`{ ok: true } | { ok: false, reason }`); reasons are `'profile-incomplete' | 'already-applied' | 'no-session'`. The gate is derived from the active professional's profile completeness via `populate → compute` from the professional services.

#### Components
- `ShiftBrowseRow.vue` — one shift in the browse list. Click anywhere → `select`, click the corner button → `apply`. Renders an "Applied" status pill instead of the Apply button when the active pro already has an application against this shift. `selected` prop drives an ink-bordered focus treatment when the row matches the dialog/map selection.
- `ShiftApplyDialog.vue` — shadcn-vue `Dialog` with full shift detail (date/time/rate/location, urgency badge, notes via `RichTextRenderer`). Banner cascade by `userType` then by per-shift state — most specific wins:
  - **Not signed in** (`userType === null`, mist) — "Sign in to apply" with two CTAs: `/login` (Sign in, primary marigold) and `/register` (Create account, ghost). Message textarea hidden, Apply button hidden.
  - **Wrong audience** (`userType === 'facility_staff'`, mist) — "Apply isn't available from a facility account." Explainer only, no CTA. Message textarea hidden, Apply button hidden.
  - **Profile incomplete** (`userType === 'professional'` + completeness < 100, blush) — Apply button hidden, CTA routes to `/professional/edit`.
  - **Already applied** (mist) — shows the application's status pill, Apply button hidden, CTA routes to `/professional`.
  - **Default** — message textarea + Apply button enabled.

#### Views
- `ShiftsBrowseView.vue` at `/shifts` — renders inside `PublicLayout`. **Public for unauth visitors and signed-in professionals; facility staff are blocked at the router guard** (the staff lockdown rule keeps staff scoped to `/facility/*`). Heading + intro, filter row (search + shift-type pill toggles + urgent-only + clear-all + results count + mobile **List/Map** toggle), then a split layout: scrollable list of `ShiftBrowseRow`s (left) + sticky `ShiftMap` (right) on lg+. **On mobile (`<lg`)**, the segmented `List | Map` toggle in the filter bar swaps which panel is visible — one at a time, so each gets full vertical real estate (the map gets `h-[70vh] min-h-[420px]`). Both panels keep `lg:block` so they stay side-by-side at lg+; the toggle hides via `lg:hidden`. The map wrapper has `class="isolate"` so Leaflet's z-indexes don't bleed through overlays. The `ShiftApplyDialog` is mounted at the page level and driven by `selectedShift`; the parent passes `auth.userType` so the dialog can render the appropriate gate banner. Apply is gated to authed professionals only — unauth visitors see a sign-in CTA. The dialog also carries a defensive wrong-audience branch for facility staff, but the guard prevents that branch from being reached in normal operation.

#### Notes
Single-facility model: shifts have no `facilityId` field — they implicitly belong to the one facility in the prototype. `lat`/`lng` are optional; the seeded shifts all have them (Sydney suburbs with ±0.005° jitter), user-posted shifts currently don't (could be added via geocoding the `location` string later).

Cross-module dependency: `useShiftsBrowse` imports `computeProfileCompleteness` and `populateProfessionalProfileForm` from `@/modules/professional/services/ProfessionalProfileForm` for the apply gate. One-way dependency (shifts → professional), no cycle.

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

Dummy authentication, persisted to `localStorage`. Backs all four auth flows in `user/` (staff login + registration, professional login + registration).

- Session state: `userType: UserType | null`, `userId: string | null`, `facilityId: string | null`
- Registration state (persisted): `createdStaff: FacilityStaff[]`, `createdProfessionals: Professional[]`, `onboardedStaffIds: string[]`
- Profile-edit state (persisted): `professionalProfileOverrides: Record<string, Partial<Professional>>` — keyed patches applied on top of seeded professional records, so edits to seed pros survive reload without mutating the seed JSON
- Getters: `isAuthenticated`, `isFacilityStaff`, `isProfessional`, `hasCompletedOnboarding`, `currentFacility`, `currentFacilityStaff`, `currentProfessional`, `allFacilityStaff` (seed + created), `allProfessionals` (seed-with-overrides + created)
- Lookup helpers: `findFacilityStaffByEmail(email)`, `findProfessionalByEmail(email)`, `nextStaffId()`, `nextProfessionalId()`
- Actions: `loginAsFacility(id?)`, `loginAsProfessional(id?)`, `signUpAsFacility({ staff })`, `signUpAsProfessional({ professional })`, `updateProfessionalProfile(patch)`, `markOnboardingComplete(staffId)`, `logout()`

**Single-facility model:** registration never creates a new `Facility` — every staff is assigned to the seeded facility. The `signUpAsFacility` action pushes the new `FacilityStaff` onto a persisted array (so login lookup finds them across reloads) and opens a session as the new staff.

**Professionals are independent of any facility.** `signUpAsProfessional` just pushes onto `createdProfessionals[]` and opens the session. No `facilityId`, no onboarding flag.

Login lookups for both audiences walk seed + created arrays via the `findXByEmail` helpers, so freshly-registered users can sign back in after logging out.

`hasCompletedOnboarding` is consulted by the router guard — authed staff with `false` are bounced to `/staff/onboarding` until they finish the wizard. Professionals always read `true` (no onboarding for them).

> Type-checker note: `persist: true` is cast as `Record<string, unknown>` for the same pinia/Vue 3.5/persistedstate quirk noted on `useShiftsStore`.

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

## App-shared views (`src/views/`)

For views that aren't owned by a specific feature module.

### HomeView.vue

The full editorial landing at `/`. Single-file view that owns every section so anchor links can scroll-target IDs on the same page. Wrapped by `PublicLayout`.

Sections, in order:

1. **Hero** — eyebrow pill / serif headline with marigold accent + hand-drawn SVG underline / subhead / dual CTAs (forest-deep "Sign up as professional" + outline "Sign up as facility staff") / landscape mockup with sage wash backdrop and three floating UI annotation pills (Sydney CBD / AHPRA verified / 120+ shifts open) / wordmark-style trust row of fictional Sydney facilities. Section bg has a dotted-grid texture (radial-gradient pattern, edge-masked).
2. **For Professionals** (`#for-professionals` implicit, no anchor) — split column. Healthcare-worker portrait with built-in backdrop on the left + decorative pills (AHPRA verified / "Applied in 6 seconds" / 4.9★ rating). Copy + 3 feature bullets (One-tap apply / Verified facilities only / Choose your own hours) on the right. CTA → `/register`.
3. **For Facilities** (`#for-facilities`) — mirrored layout (copy left, dashboard mockup right with image-first DOM order so it shows above copy on mobile). Decorative pills (Filled in 8 min / 12 verified applicants / $420 saved vs agency). 3 feature bullets (Post in 60 seconds / Verified credentials only / No agency markups). Graphic-overlay layer (sage SVG curve, marigold halo, dotted texture, three confetti shapes). CTA → `/staff/registration`.
4. **Testimonials** (`#testimonials`) — 6-card grid (3-col on lg+, 2-col on md, 1-col on mobile). Worker portraits + 5-star ratings + per-card shift-count flourish. Card tints rotate cream → sage → marigold; per-card tilts give a magazine-collage feel. Section overlay: giant marigold serif quote watermark + sage SVG curve + scattered confetti dots.
5. **About** (`#about`) — bento grid: tall photo on the left + marigold gradient stat tile (60% faster fill) + photo top-right + photo bottom-middle + forest-deep gradient stat tile (<5min apply). Mission split below with 4-stat row (120+ shifts / 850+ professionals / 43 facilities / 4.9★ rating). Soft radial-gradient backdrop (sage halo top-left + marigold halo bottom-right).
6. **Contact** (`#contact`) — bone-card form (name + email + textarea) on the left with a Vue `<Transition>` that swaps to a thank-you panel on submit and resets the form after 5 seconds (no real network call). Leaflet map of Sydney CBD on the right with a custom marigold pin (animated halo via Tailwind `animate-ping`) + popup; below it a 3-cell contact-details strip (Office / Email / Phone). Mirror radial-gradient backdrop.
7. **Footer** — closing CTA banner (forest-deep card with dotted texture + marigold halo + dual CTAs), 4-column link spread (brand block with socials + Product + Company + Resources), copyright row with Privacy / Terms / Security legal links.

Header `About` and `Contact` items target `/#about` and `/#contact`. `scrollBehavior` in the router smooth-scrolls with an 80px sticky-header offset; navigation from a different route waits 350ms before scrolling so HomeView has time to mount. No active-class on the home-page nav items since they all resolve to `/`.

### AboutView.vue / ContactView.vue

Legacy placeholder views at `/about` and `/contact`. Kept for direct URL access but the header no longer points to them — About / Contact in the nav now scroll into the home page sections (`/#about`, `/#contact`) instead.

### NotFoundView.vue

The 404 destination. Reachable two ways:
- Direct visit to `/404`
- Catch-all route `/:pathMatch(.*)*` redirects unknown URLs here
- Visiting any `/shifts` style not-yet-built path 404s for now (Phase B builds them)

The home-CTA adapts to the active session: facility staff → `/facility`, professional → `/professional`, unauth → `/staff/login`.

> NotFoundView is intentionally NOT inside `PublicLayout` — it has its own minimal chrome so the 404 reads as a clean error page.

---

## Layouts (`src/layouts/`)

Route-level shells that wrap groups of routes with shared chrome (header, sidebar, etc.).

### PublicLayout.vue

Wraps `/`, `/about`, `/contact`, `/professional`, and `/shifts` with `PublicHeader` + `<RouterView v-slot>`. Children render below the sticky header on a `bg-cream` page.

The inner `<RouterView>` is wrapped with `<Transition name="page" mode="out-in">` keyed on `route.path` so within-layout route swaps fade-and-slide. Hash navigation (`/#about`, `/#contact`) doesn't remount the page — only real route changes transition. See "Page transitions" below.

Routes intentionally outside this layout (so they keep their own chrome):
- `/login`, `/register`, `/staff/login`, `/staff/registration`, `/staff/onboarding` — auth views, self-contained editorial two-pane layout
- `/facility/*` — uses the forest-green sidebar shell (`FacilityLayoutView`)
- `/404` — clean error page, no header

### Page transitions

Wrapped around every `<RouterView>` in the app: `App.vue` (cross-layout swaps), `PublicLayout.vue` (within public layout), and `FacilityLayoutView.vue` (within facility portal). Pattern:

```vue
<RouterView v-slot="{ Component, route }">
  <Transition name="page" mode="out-in">
    <component :is="Component" :key="route.path" />
  </Transition>
</RouterView>
```

CSS lives in `src/assets/main.css` under `.page-enter-active` / `.page-leave-active`: 250ms ease on `opacity` + `transform`, with a small vertical translate (enter from `+8px`, leave to `-4px`). `mode="out-in"` runs leave-then-enter so we never see two pages stacked. A `@media (prefers-reduced-motion: reduce)` block falls back to a 150ms opacity-only fade with no movement.

Keyed on `route.path` rather than `route.fullPath` so hash navigation (used by the public header's About / Contact items) doesn't remount the home page mid-scroll.

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

### PublicHeader.vue

The session-aware header rendered by `PublicLayout`. Sticky on scroll (`bg-cream/85` + `backdrop-blur` + 1px `border-mist` bottom — no shadow, per BRAND.md).

Desktop layout (`md+`): wordmark left → nav middle (Home · About · Contact · Shift search) → actions right.

**Logged out:** two login buttons.
- "Login as facility staff" — ghost link
- "Login as professional" — filled marigold pill (primary CTA — pros are the larger audience)

**Logged in (professional or facility staff):** avatar circle + first name + Sign out.
- Avatar circle: marigold bg, ink initials (up to two letters), Fraunces type. Clickable — links to the user's dashboard via the inline `dashboardPath` (`/professional` for pros, `/facility` for staff).
- First name: hidden on mobile to keep the right side compact.
- Sign out: ghost button. Calls `auth.logout()` then routes to `/`.

**Mobile layout (`<md`):** the inline nav and right-side actions hide. The right side becomes a compact strip: avatar (when signed in) + a hamburger button. Tapping the hamburger opens a shadcn-vue `Sheet` drawer from the right with the same nav links + a logged-in identity strip + the same login / sign-out actions, so mobile users get full access without sacrificing header space. Each nav link calls `closeMobileMenu()` on click for an auto-close-on-navigation experience. The Sheet uses brand styling (`bg-cream`, `border-mist`, no shadow).

Nav `RouterLink`s use `active-class` for a subtle "current page" treatment.

### DatePicker.vue

Calendar-popover date input. Wraps shadcn-vue's `Calendar` + `Popover` + `Button` so the rest of the app keeps working with plain ISO date strings; the `@internationalized/date` `DateValue` bridge lives only inside this component.

Public API mirrors a native `<input type="date">`:

```ts
defineProps<{
  modelValue: string         // YYYY-MM-DD; '' = unset
  id?: string
  placeholder?: string       // default 'Pick a date'
  minDate?: string           // YYYY-MM-DD, optional
  maxDate?: string           // YYYY-MM-DD, optional
  class?: HTMLAttributes['class']
}>()
defineEmits<{ (e: 'update:modelValue', value: string): void }>()
```

Trigger button shows the formatted date when set ("Thu 14 May 2026" via `Intl`) or the placeholder when empty. `parseDate` is wrapped in try/catch — a stale localStorage value with a malformed date won't crash the popover; it just shows the placeholder and the form's validation handles the user-facing error.

Default surface is `bg-cream` (suits the edit-form context where the field sits inside a bone card). Override via the `class` prop for other contexts (e.g. forms on a cream page where `bg-bone` reads better).

Used by `ProfessionalProfileEditView` for all four date fields (DOB, last clinical practice, WWCC expiry, available-from). `PostShiftForm.vue` still has its own inline calendar+popover from before this component existed; easy follow-up to migrate.

### CalendarMonth.vue

Reusable monthly calendar — Mon-first 6-row grid (so layout never reflows between 5- and 6-week months). Editorial brand register: bone surface, mist hairlines, no shadows, marigold today-ring, ink-on-cream selected-date.

Props (all optional):
- `month?: string` (`YYYY-MM`) — which month renders. Defaults to "now". Two-way via `update:month` so prev/next chevrons can drive `v-model:month`.
- `entries?: ReadonlyArray<CalendarEntry>` — dates to mark with a coloured dot. `CalendarEntry = { date, id?, tone?: 'upcoming' | 'past' }`. Strongest tone wins when multiple entries fall on the same date (upcoming > past).
- `selectedDate?: string` (`YYYY-MM-DD`) — visually highlighted as the active selection. Two-way via `update:selectedDate`.

Emits: `update:month`, `update:selectedDate`, `select` (the date string when a cell is clicked).

Header shows `Month YYYY` with prev/next chevrons and a Today button. Footer shows a small legend (Upcoming · Past · Today). Out-of-month cells are dimmed but clickable so the user can flow into adjacent months.

Used by `ProfessionalScheduleTab` for the calendar view. Likely future consumers: facility shift map (heatmap of postings per day), professional applications view (show when each was submitted).

### TimePicker.vue

Custom 12-hour time picker with AM/PM. Built on shadcn-vue Popover + themed Button. Three columns inside the popover: Hour (01–12), Min (configurable step, default 1), Period (AM/PM). Auto-scrolls active items into view on open.

Public API: `v-model` is a 24-hour `'HH:mm'` string. Internal display is 12-hour. Used in PostShiftForm for Start / End time fields.

### ShiftMap.vue

Reusable Leaflet map. Renders pins per shift (sage = open, blush = urgent+open, mist = claimed). Pin colors driven by brand CSS variables. Tile provider: CartoDB Voyager (no API key). Themed popup matching cream/bone surfaces.

Props: `shifts`, `center?`, `zoom?`, `selectedId?`, `selectedZoom?`. When `selectedId` changes, map flies to that pin and opens its popup. Emits `select` when a pin is clicked, so the parent can update its highlighted item.

**Defensive coord handling** (added when bad data started leaking through):
- `pinnableShifts` filter uses `Number.isFinite(s.lat) && Number.isFinite(s.lng)` — rejects null, undefined, `NaN`, and `Infinity`. The previous `!= null` filter let `NaN` through and crashed `flyTo` with "Invalid LatLng object".
- `focusSelected` re-checks the marker's `getLatLng()` for finiteness before calling `flyTo`. Defence in depth.

**Z-index isolation:** Leaflet's internal z-indexes (markers up to 600, popups 700, controls 800) bleed through any overlay above them by default. Consumers should wrap the map in a div with `class="isolate"` (= `isolation: isolate`) so those z-indexes stay scoped. Both current consumers (`ShiftMapView`, `ShiftsBrowseView`) do this already.

Used by `ShiftMapView.vue` (facility) and `ShiftsBrowseView.vue` (professional). Reusable elsewhere — e.g. shift detail page could use it to show one pin.

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

## Static assets (`src/assets/`)

| File | Used by | Notes |
|---|---|---|
| `main.css` | global | Tailwind v4 theme tokens + shadcn semantic mappings + sidebar overrides. Source of truth for `forest`, `forest-deep`, `cream`, `bone`, `ink`, `marigold`, `blush`, `sage`, `mist`. |
| `illustrations/auth-login.png` | `StaffLoginView` | Flat-vector nurse-with-phone illustration. Background hex matches `forest-deep` (`#003829`). |
| `illustrations/auth-registration.png` | `StaffRegistrationView` | Paired nurse-arranging-setup illustration. Same background hex. |

Illustrations are imported via Vite (`import x from '@/assets/illustrations/...'`) so the build emits cache-busted hashed URLs and the file shows up in the production bundle's `dist/assets/`.

If you regenerate the auth illustrations, see BRAND.md's "Auth-screen illustrations" section for the rules they need to follow (background hex, palette, composition).

---

## Mock data (`src/data/`)

Hand-curated JSON, regenerated where indicated by the script in `scripts/`.

| File | Records | How to regen | Consumed by |
|---|---|---|---|
| `facilities.json` | 1 facility (St. Vincent's Aged Care, Bondi) | hand-edited | `useAuthStore`, `FacilitySidebar`, `EditShiftView`, etc. |
| `facilityStaff.json` | 5 staff (Sarah, David, Priya, Tom, Linda) all under fac_001 | hand-edited | `useAuthStore.loginAsFacility(id)` |
| `professionals.json` | 10 (RN/EN/AIN/Carer/Midwife mix; full profiles — bio, AHPRA, DOB, WWCC, specialties, skills, certifications, preferred locations + shift types, languages, right-to-work, last clinical practice, available-from) | hand-edited | `useAuthStore`, `ApplicantRow`, `ClaimedByBadge`, `ProfessionalProfileTab` |
| `shifts.json` | 121 (varied roles, dates, locations, lat/lng, statuses) | `npm run data:shifts` | `useShiftsStore` |
| `applications.json` | ~265 (1 accepted per claimed shift, 1–5 pending per open shift) | `npm run data:applications` | `useApplicationsStore` |

`npm run data:all` regenerates shifts then applications in order (the second references shift ids).
