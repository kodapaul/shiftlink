# TODOS

Build plan for the prototype. Reflects reality, not the original waterfall — the project ended up iterating into bonus features (edit shift, applications, map, rich text) ahead of the originally planned phases (real signup, professional board, landing).

---

## Done

The facility-side experience is complete end-to-end, including signup / login / onboarding.

| Area | What works |
|---|---|
| **Setup** | Vue 3 + TS + Vite + Tailwind v4 + shadcn-vue + Pinia + persistedstate. Theme overrides (forest / cream / bone / ink / marigold / blush / sage / mist). Fraunces + Inter fonts. |
| **Domain** | Single-facility model. Modules: `user`, `professional`, `facility`, `shifts`, `applications`. Modular per-feature with `types/`, `enums/`, `services/`, `composables/`, `components/`, `views/`. |
| **Mock data** | 1 facility, 5 staff, 10 professionals, 121 shifts, ~265 applications. Generators in `scripts/`, `npm run data:all` to regenerate. |
| **Persistence** | All Pinia stores persist to localStorage. Edits / posts / deletes / accepts survive reload. |
| **Auth flows (mock)** | `/staff/login`, `/staff/registration`, `/staff/onboarding` under `src/modules/user/`. Login resolves staff by email against seed + registered users; registration creates a `Facility` + `FacilityStaff` pair persisted alongside the session; onboarding is a four-step wizard (welcome → facility → invite → done). Router guard redirects unauth visitors to `/staff/login` and incomplete-onboarding users to `/staff/onboarding`. |
| **Facility portal** | Sidebar nav (All posted shifts · Post a shift · Applications · Shift map). Greeting header, search, status tabs, shift cards with applicant counts or claimer badge. Logout in sidebar footer routes back to `/staff/login`. |
| **Post / Edit / Delete shifts** | Full CRUD form with shadcn DatePicker, custom 12-hour AM/PM TimePicker, free-text role, optional location, marigold "Post shift" CTA, in-place edit at `/facility/shifts/:id/edit`, delete with confirmation Dialog. |
| **Shift detail page** | `/facility/shifts/:id` with Overview / Applications tabs. Default tab is Applications when there are pending. |
| **Applications system** | `applications` domain module with type, enum, service, store, composables, 4 reusable components. Per-shift list with accept/decline. Cross-shift triage view at `/facility/applications` with search + status tabs. Accept auto-claims the shift and auto-declines competing pendings. |
| **Shift map** | Leaflet + CartoDB Voyager tiles (no API key). Pins for all open / claimed shifts across Sydney. Split list-on-left + map-on-right view at `/facility/map` with click-to-fly. |
| **Rich text notes** | Tiptap-backed `RichTextEditor` (toolbar: bold, italic, h2, h3, bullet list, ordered list, link). DOMPurify-sanitized `RichTextRenderer` for display. Seed bank includes structured HTML notes. |

---

## Phase A — Login + Signup + Onboarding (facility)  ✅ DONE

Replaced the auto-impersonate hack with a real-feeling, mock-backed auth flow. Submission stays in-memory + persisted to localStorage; no backend.

### Shipped

- [x] Sub-feature `src/modules/user/staff-login/` (types · service · composable · component · view)
  - `StaffLoginFormValues / Errors / Status` types
  - `validateStaffLoginForm`, `submitStaffLoginForm` (resolves staff by email via callback so the auth store stays the single source of truth)
  - `useStaffLoginForm()` — calls `auth.loginAsFacility(staffId)`, routes to `/staff/onboarding` (first time) or `/facility` (returning)
  - `StaffLoginForm.vue`, `StaffLoginView.vue` at `/staff/login` (with demo-accounts panel)
- [x] Sub-feature `src/modules/user/staff-registration/` (types · enums · service · composables · components · views)
  - `StaffRegistrationFormValues / Errors / Status` types (staff fields + password only — no facility inputs); `OnboardingStep` enum
  - `validateStaffRegistrationForm` (rejects email collisions vs. seed + already-created staff), `buildStaffFromForm`, exported `SINGLE_FACILITY_ID` constant
  - `useStaffRegistrationForm()` — calls `auth.signUpAsFacility({ staff })`, routes to `/staff/onboarding`
  - `useOnboarding()` — step state machine (`current`, `next`, `back`, `goTo`, `complete`)
  - `StaffRegistrationForm.vue` (3 sections: read-only facility info card / you / password), `OnboardingStepper.vue` (reusable)
  - `StaffRegistrationView.vue` at `/staff/registration`
  - `StaffOnboardingView.vue` at `/staff/onboarding` (4 steps: welcome → read-only facility confirmation → invite staff stub → done)
- [x] Auth store updates
  - Single-facility model: registration never creates a new `Facility`
  - Persisted: `createdStaff[]`, `onboardedStaffIds[]`
  - New helpers: `findFacilityStaffByEmail`, `nextStaffId`
  - New actions: `signUpAsFacility({ staff })`, `markOnboardingComplete(staffId)`
  - New getters: `hasCompletedOnboarding`, `currentFacility`, `allFacilityStaff`
  - `loginAsFacility(staffId)` now resolves against seed + created staff
- [x] Routing
  - Public: `/staff/login`, `/staff/registration`
  - Authed-but-onboarding-exempt: `/staff/onboarding`
  - Protected (`requiresUserType: 'facility_staff'`): everything under `/facility/*`
  - Guard redirects unauth → `/staff/login`, incomplete-onboarding → `/staff/onboarding`
  - `FacilityLayoutView` stripped of the auto-impersonate fallback; sidebar logout routes to `/staff/login`
- [x] **Folder layout flattened** — sub-feature folders (`staff-login/`, `staff-registration/`) dissolved into the standard `user/types/`, `user/services/`, etc. with audience-prefixed file names
- [x] **Visual polish on `/staff/login` + `/staff/registration`** — sticky rounded `forest-deep` card on the left (never scrolls), scrollable form column on the right. Paired flat-vector illustrations in `src/assets/illustrations/` (background hex matches `forest-deep` so the image and the card read as one continuous plane). Card uses an explicit 3-row grid (`auto / minmax(0,1fr) / auto`) so wordmark, illustration+copy, and tagline never collide on short viewports.
- [x] **Auth middleware** — `meta.guestOnly` redirects authed users away from login/registration (staff → `/facility`, professional → `/404`). `/404` route + catch-all in `src/views/NotFoundView.vue`.
- [x] CONFIGURATIONS.md updated to allow auth flows in `user/` (flat layout, audience-prefixed names); folder-structure block + types-table extended
- [x] DOCUMENTATIONS.md updated with the new flat module description, expanded auth-store API, app-shared `views/`, and a static-assets section
- [x] BRAND.md updated with the `forest-deep` palette token and the auth-illustration ruleset
- [x] WORKFLOW.md updated with the new auth flow + guard semantics (see below)

### Out of scope (deferred)

- Professional-side login/signup → Phase B
- Real password hashing, forgot-password, email verification → not in brief

---

## Phase B — Professional shift board (`/shifts`)

The user-side counterpart. Reuses everything: `useShiftsStore`, `ShiftMap`, status badges, `RichTextRenderer`. New surface: shift list with filters, claim CTA on cards, my-claimed-shifts view.

### Auth — DONE

Mirrored the staff pattern under `user/` with audience-prefixed file names (per CONFIGURATIONS.md, the `user/` module is cross-audience for auth flows).

- [x] Types: `ProfessionalLoginForm.ts`, `ProfessionalRegistrationForm.ts`
- [x] Services: `validateProfessionalLoginForm`, `submitProfessionalLoginForm`, `validateProfessionalRegistrationForm`, `buildProfessionalFromForm`
- [x] Composables: `useProfessionalLoginForm()`, `useProfessionalRegistrationForm()` (no professional `useOnboarding` — professionals skip onboarding)
- [x] Components: `ProfessionalLoginForm.vue`, `ProfessionalRegistrationForm.vue`
- [x] Views: `ProfessionalLoginView.vue` at `/login`, `ProfessionalRegistrationView.vue` at `/register` (professional side gets the unprefixed URLs as the "primary" audience; staff stays under `/staff/...`)
- [x] Auth store: `signUpAsProfessional({ professional })`, `findProfessionalByEmail`, `nextProfessionalId`, `allProfessionals` getter, persisted `createdProfessionals[]`
- [x] Router: routes added; guard `homePathFor`/`loginPathFor` helpers route by audience (authed pro → `/professional`, unauth on protected pro route → `/login`)
- [x] Placeholder `/professional` view at `src/modules/professional/views/ProfessionalHomeView.vue` so the auth round-trip lands somewhere real

### Professional dashboard at `/professional` — DONE

The placeholder home view is now a three-tab dashboard. Each tab is its own component composing a thin composable over the existing stores.

- [x] Type extensions to `Professional` — bio, ahpraNumber (conditional on role), dateOfBirth, rightToWork (new enum), languages, lastClinicalPractice, specialties (new enum, multi-select), skills, wwcc (compound), preferredShiftTypes (reuses ShiftType), availableFrom. Plus `ProfessionalProfileForm…` types and `ProfessionalProfileCompleteness` derived view.
- [x] Auth store: `updateProfessionalProfile(patch)` action + persisted `professionalProfileOverrides` map so edits to seeded pros survive reload without mutating the seed JSON.
- [x] Service: `validateProfessionalProfileForm`, `computeProfileCompleteness`, `buildProfilePatchFromForm`, `populateProfessionalProfileForm`, `roleRequiresAhpra`.
- [x] Composables: `useProfessionalProfileForm` (read+edit toggle, derived completeness), `useProfessionalApplications` (filter pills + search), `useProfessionalSchedule` (Upcoming / Past + nextShift).
- [x] Components: `ProfileCompletenessBadge`, `ProfessionalApplicationRow`, `ProfessionalScheduleRow`, `ProfessionalProfileTab` (read-only summary, links to `/professional/edit`), `ProfessionalApplicationsTab`, `ProfessionalScheduleTab`.
- [x] `ProfessionalHomeView` rewritten with shadcn-vue Tabs.
- [x] **Profile editing extracted to its own route at `/professional/edit`** (`ProfessionalProfileEditView.vue`). Dedicated edit page with header, completeness badge, five form sections, and a sticky save bar pinned to the bottom. Profile tab on the dashboard is now strictly read-only; the "Edit profile" button is a `RouterLink`.
- [x] Seed `professionals.json` backfilled — 10 demo pros now ship with full, realistic profiles (bio, AHPRA, DOB, WWCC, specialties, skills, etc.) so the dashboard reads as "completed" out of the box.

### Shift board at `/shifts` — DONE

The `shifts/` module is now domain + feature. Files added:
- `services/ShiftsBrowse.ts` — pure filter + applied-set helpers
- `composables/useShiftsBrowse.ts` — reactive filter, selection, apply gate, `applyToShift` returning a discriminated `ApplyResult` (`{ ok: true } | { ok: false, reason: 'profile-incomplete' | 'already-applied' | 'no-session' }`)
- `components/ShiftBrowseRow.vue` — list row, click → select, click button → apply, renders `ApplicationStatusBadge` instead of the Apply button when the active pro already has an application
- `components/ShiftApplyDialog.vue` — shadcn `Dialog` with three banner states (profile-incomplete with a CTA to `/professional/edit` / already-applied with status pill / default with optional message + apply)
- `views/ShiftsBrowseView.vue` at `/shifts` — heading + intro, filter row (search · shift-type pill toggles · urgent-only · clear-all · results count · mobile map toggle), split list+map layout (sticky map on lg+), `ShiftApplyDialog` mounted at the page level
- Route registered under `PublicLayout` with `requiresUserType: Professional`. The `PublicHeader`'s "Shift search" nav link finally lights up.

### Shift board — TODO (smaller follow-ups)

- [ ] Detail at a real URL — `/shifts/:id` (currently the dialog covers it; deep-linking would also need the URL).
- [ ] Default-sort / pre-filter the list using the active pro's `preferredLocations`, `preferredShiftTypes`, `availableFrom`. Plumbing exists; just needs wiring.
- [ ] Date range + rate range filters (currently search + shift-type + urgency only).
- [ ] My-claims dedicated view (currently shown via the dashboard's Schedule tab).
- [ ] (Optional polish) generate a paired professional auth illustration set following BRAND.md's "Auth-screen illustrations" rules; drop into `src/assets/illustrations/auth-pro-login.png` and `auth-pro-registration.png` and wire into the views (slot already documented in the view file headers).

---

## Phase C — Polish

- [ ] Empty / loading / error states across every view
- [ ] Keyboard nav audit (focus rings, tab order)
- [x] 404 route (`/404` + catch-all → `src/views/NotFoundView.vue`; guard redirects authed-pro → `/404` on guest-only routes)
- [ ] Page titles per route
- [ ] Favicon
- [ ] Cross-browser smoke (Chrome, Safari, Firefox)
- [x] **Mobile responsive pass — partial.** Shipped: hamburger menu in `PublicHeader` (Sheet drawer with nav + actions), mobile List/Map toggle on `/shifts`, mobile single-column stack on `/facility/map`, Leaflet z-index isolation on map wrappers (`isolate` class) so popups/markers don't bleed through overlays, defensive NaN guard in `ShiftMap.focusSelected`, random Sydney coords for newly posted shifts so they pin on the map. Still TODO: `375px` width audit across every view.
- [x] **Reusable `DatePicker`** at `src/components/DatePicker.vue` — Calendar + Popover wrapper that takes a YYYY-MM-DD string via `v-model`. Used on `/professional/edit` for all four date fields (DOB, last clinical practice, WWCC expiry, available-from). Replaces the brittle native `<input type="date">` styling and gives consistent eucalyptus-themed pickers across the app.

---

## Phase D — Public landing page (`/`)  ✅ DONE

The full editorial landing replaces the stub. All sections live in a single `HomeView.vue` so anchor scrolling works naturally; the `PublicHeader`'s About / Contact items target `/#about` and `/#contact` and the router's `scrollBehavior` smooth-scrolls with a sticky-header offset.

- [x] **Public layout shell** — `src/layouts/PublicLayout.vue` wraps `/`, `/professional`, `/shifts` with a sticky `PublicHeader`. Mobile gets a Sheet-drawer hamburger; auth and facility routes intentionally stay outside this layout.
- [x] **Hero** — editorial cream-on-cream with dotted-grid texture, marigold accent on the second headline line, hand-drawn SVG underline flourish, dual CTAs (forest-deep "Sign up as professional" + outline "Sign up as facility staff"), landscape mockup with sage wash backdrop, three floating UI annotation pills (`Sydney CBD`, `AHPRA verified`, `120+ shifts open`), and a wordmark-style trust row of fictional Sydney facilities.
- [x] **For Professionals section** — split column, healthcare-worker image with built-in backdrop on the left + decorative pills (AHPRA verified, "Applied in 6 seconds", 4.9★ rating) and copy + 3 feature bullets on the right (One-tap apply / Verified facilities only / Choose your own hours). CTA → `/register`.
- [x] **For Facilities section** — mirrored layout (copy left, dashboard mockup right) with its own decorative pills (Filled in 8 min / 12 verified applicants / $420 saved vs agency) + 3 feature bullets (Post in 60 seconds / Verified credentials only / No agency markups). Image-first DOM order so it's visible above the copy on mobile. CTA → `/staff/registration`. Graphic-overlay layer (sage curve, marigold halo, dotted texture, confetti shapes).
- [x] **Testimonials section** — six fictional Sydney pros across the role mix (RN, EN, AIN, midwife, carer) with worker portraits, 5-star ratings, shift-count flourish on the attribution row. Card tints rotate cream → sage → marigold for collage feel; per-card tilts; section overlay with giant marigold serif quote watermark, sage SVG curve, scattered confetti dots.
- [x] **About section** — bento grid: tall photo + marigold gradient stat tile (60% faster fill) + photo + photo + forest-deep gradient stat tile (<5min apply). Mission split below with 4-stat row (120+ shifts, 850+ professionals, 43 facilities, 4.9★). Soft radial-gradient backdrop (sage halo + marigold halo).
- [x] **Contact section** — bone-card form (name + email + message) on the left with a Vue `<Transition>` that flips to a thank-you panel on submit and resets the form after 5 seconds (no real network call). Leaflet map of Sydney CBD on the right with a custom marigold pin + animated halo + popup, plus a 3-cell contact-details strip (Office / Email / Phone). Mirror radial-gradient backdrop.
- [x] **Footer** — closing CTA banner (forest-deep card with dotted texture + marigold halo + dual CTAs), 4-column link spread (brand + Product + Company + Resources), copyright row with legal links.
- [x] **Header polish** — About / Contact nav points to `/#about` / `/#contact` with router-level `scrollBehavior` (smooth + 80px sticky-header offset + Promise delay so cross-route nav waits for HomeView to mount). No active-class on the nav links since the home-page hashes share the `/` route. Mobile back-to-home link surfaced inside all four auth views (login + registration × pro + staff) since the forest marketing card that normally carries it is `lg:hidden`.

---

## Phase E — Deploy

- [ ] `git init` + first commit (already done if user pushed)
- [ ] Push to GitHub (public)
- [ ] `firebase init hosting` with `dist/` + SPA rewrite
- [ ] `npm run build && firebase deploy`
- [ ] Add live URL to README.md

---

## Phase F — Submission

- [ ] README "what's next" note (3–5 sentences)
- [ ] Final commit + push
- [ ] Submit GitHub link + live URL + next-steps note to the brief sender
