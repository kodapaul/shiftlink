# WORKFLOW

How ShiftLink works end-to-end as it stands today. The facility-side experience is complete. The professional side has working auth, a three-tab dashboard at `/professional` (Profile · Applications · Schedule), and a shift browse + apply view at `/shifts`. The public landing page is the last build phase.

---

## 1. User flow (facility-side)

```
                        Visitor lands on /
                                │
                                ▼
                   Auto-redirect to /staff/login
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
        Returning user                        New user
        (signs in with email)         (clicks "Register your facility")

   The professional flow runs the same shape on `/professional/*`:
   `loginAsProfessional(id)` for returning, `signUpAsProfessional({ professional })`
   for new. There is no professional onboarding step — both branches route
   straight to `/shifts`.

              │                                   │
              ▼                                   ▼
       useAuthStore                     /staff/registration
       .loginAsFacility(staffId)             │
              │                              ▼
              │                  Form: read-only facility card + you + password
              │                  (single-facility model — staff are auto-assigned
              │                   to the seeded facility, no facility inputs)
              │                              │
              │                              ▼
              │                  useAuthStore.signUpAsFacility({ staff })
              │                  - pushes to createdStaff[]
              │                  - opens session as the new staff
              │                              │
              │                              ▼
              │                       /staff/onboarding
              │                  (4 steps: welcome → facility → invite → done)
              │                              │
              │                  auth.markOnboardingComplete(staffId)
              │                              │
              └──────────────────┬───────────┘
                                 ▼
         ┌──────────────────────────────────────────┐
         │ FacilityLayoutView                       │
         │  - Hydrates shifts + applications stores │
         │  - Renders sidebar + RouterView          │
         │  (auth enforced upstream by router guard)│
         └────────────────┬─────────────────────────┘
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
   /facility       /facility/        /facility/
   (dashboard)     applications      map
       │             (triage)        (Sydney pins)
       │                  │                  │
       ▼                  ▼                  ▼
   Card click      Accept/Decline     Click pin or list
   → detail        → store mutates    → flies to shift
                     shift status

                          │
                          ▼
              /facility/shifts/:id
              (Detail: Overview / Applications tabs)
                          │
                  ┌───────┴───────┐
                  │               │
                  ▼               ▼
              [ Edit ]       Accept / Decline
              /facility/     applicant
              shifts/:id/    → cross-store
              edit             mutation

                          │
                          ▼
              Sidebar footer "Switch / sign out"
                  → auth.logout()
                  → router.push('/staff/login')
```

Every store mutation persists to localStorage so the demo state sticks across reload — including the session, registered facility/staff, and the onboarding-complete flag.

---

## 2. Route map

Routes are grouped by which **layout shell** they render inside:

```
                                       Vue Router
                                            │
   ┌──────────────────────┬─────────────────┼─────────────────┬───────────────────────┐
   │                      │                 │                 │                       │
 PUBLIC LAYOUT       AUTH (self-contained)  FACILITY LAYOUT   AUTH-FACILITY-ONLY    NO LAYOUT
 PublicHeader +      Editorial two-pane     Forest sidebar    Editorial wizard       (clean)
 RouterView          (forest card + form)   shell             (4-step)
   │                      │                  │                 │                      │
   ▼                      ▼                  ▼                 ▼                      ▼
 /                    /staff/login         /facility           /staff/onboarding    /404
 /about               /staff/registration  /facility/shifts/new                     (catch-all
 /contact             /login               /facility/shifts/:id                      → /404)
 /professional        /register            /facility/shifts/:id/edit
 /professional/edit                        /facility/applications
 /shifts (public,                          /facility/map
   no staff)
```

The professional side gets the "primary" unprefixed URLs (`/login`, `/register`, `/professional`) since they're the larger audience; staff is namespaced under `/staff/...` and `/facility/...`.

Guards (`src/router/index.ts`) — all in `router.beforeEach`, driven by route `meta`:

- **`meta.guestOnly: true`** (the four auth routes) — if already signed in, bounce away. Authed facility staff → `/facility`; authed professional → `/professional`. Centralised in `homePathFor(userType)`.
- **Facility staff lockdown** — `auth.isFacilityStaff` users are scoped to their portal. The guard runs after the guestOnly check and redirects any path that isn't `/facility/*`, `/staff/onboarding`, or `/404` to `/facility`. So staff can't browse the public landing, About / Contact stubs, the professional dashboard, or the shift search — they live entirely inside their sidebar shell.
- **`meta.requiresUserType: 'facility_staff' | 'professional'`** — needs a matching session. Unauth visitors are sent to the appropriate login (`loginPathFor(required)` — staff routes go to `/staff/login`, professional routes to `/login`). Wrong-audience visitors bounce to their own home via `homePathFor(auth.userType)`.
- **`meta.allowDuringOnboarding: true`** (onboarding view only) — exempts the route from the "incomplete onboarding → bounce to onboarding" check so the onboarding view itself doesn't redirect-loop.
- **Onboarding gate:** authed facility staff with `hasCompletedOnboarding === false` get pushed to `/staff/onboarding` unless the destination is onboarding-exempt. Professionals don't have onboarding so this never fires for them.
- **Anything else** (`/404` and any unknown path) renders the 404 view.

The professional **browse + apply** experience at `/shifts` is shipped: filter pills, search, split list+map layout, an apply dialog with multi-state gate, and "Applied" pills on rows the pro has already submitted. **Browsing is public for unauth visitors and professionals** — anyone (signed-out or signed-in pro) can visit `/shifts` and see the open shifts and the map. Facility staff are blocked at the guard level (see lockdown rule below) and never reach the page. Applying is gated to authed professionals: unauth visitors see a "Sign in to apply" banner with `/login` + `/register` CTAs in the dialog; pros with incomplete profiles see the "Complete your profile" CTA. Owned by the `shifts/` module — promoted from domain-only to domain + feature when this view shipped.

The dialog also carries a "wrong-audience" banner branch for facility staff as a defensive fallback, but in normal operation the guard prevents staff from ever reaching `/shifts` so it stays unreachable.

---

## 3. Data architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Mock data (src/data/)                                           │
│    facilities.json       1 facility (St. Vincent's, Bondi)       │
│    facilityStaff.json    5 staff under that facility             │
│    professionals.json    10 (mix of RN/EN/AIN/Carer/Midwife)     │
│    shifts.json           121 generated shifts                    │
│    applications.json     ~265 generated applications             │
│                                                                  │
│  Generators in scripts/ — npm run data:all to regenerate.        │
└────────────────┬─────────────────────────────────────────────────┘
                 │ hydrate on first load
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  Pinia stores (src/stores/), all persisted to localStorage       │
│                                                                  │
│  useAuthStore                                                    │
│    userType, userId, facilityId                                  │
│    loginAsFacility(id?), loginAsProfessional(id?), logout()      │
│                                                                  │
│  useShiftsStore                                                  │
│    shifts: Shift[]                                               │
│    create / update / remove / hydrate / sortedShifts /           │
│    openShifts / sanitizeRoles (one-time data migration)          │
│                                                                  │
│  useApplicationsStore                                            │
│    applications: ShiftApplication[]                              │
│    apply / accept / decline / hydrate                            │
│    accept() side effect: useShiftsStore.update() to flip the     │
│    linked shift to 'claimed' + auto-decline competing pendings   │
└────────────────┬─────────────────────────────────────────────────┘
                 │ consumed via composables
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  Composables                                                     │
│                                                                  │
│  Per-shift:  useShiftApplications(shiftId)                       │
│              usePostShiftForm({ editingShiftId? })               │
│                                                                  │
│  Cross-shift: useFacilityApplications()  (triage view)           │
│                                                                  │
│  All return typed ComputedRef state + typed action methods.      │
└────────────────┬─────────────────────────────────────────────────┘
                 │ template only
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  Views & components                                              │
│  Templates + bindings only. No business logic.                   │
└──────────────────────────────────────────────────────────────────┘
```

Architecture rule (also in CONFIGURATIONS.md): components stay dumb, composables glue, stores own state and cross-store side effects, services hold pure logic. No `any` anywhere.

---

## 4. Persistence behaviour

| What | Where | Survives reload? | Survives device change? |
|---|---|---|---|
| `userType` + `userId` + `facilityId` (active session) | Pinia + localStorage | ✅ | ❌ (per-browser) |
| `createdStaff[]` (registered via `/staff/registration`, all bound to the seeded facility) | Pinia + localStorage | ✅ | ❌ |
| `createdProfessionals[]` (registered via `/register`) | Pinia + localStorage | ✅ | ❌ |
| `professionalProfileOverrides` (Profile-tab edits to seeded pros, keyed by id) | Pinia + localStorage | ✅ | ❌ |
| `onboardedStaffIds[]` (per-staff onboarding-complete flag) | Pinia + localStorage | ✅ | ❌ |
| `shifts[]` (source of truth) | Pinia + localStorage | ✅ | ❌ |
| `applications[]` (source of truth) | Pinia + localStorage | ✅ | ❌ |
| Form values during editing | reactive composable (`reactive`) | ❌ (intentional) | ❌ |
| Filter / search state | reactive composable | ❌ (intentional) | ❌ |
| Seed JSON files | static, build-time | n/a | n/a (just used to hydrate empty stores) |

To reset to fresh seed data: clear `localStorage` (DevTools → Application → Storage → Clear). Next load re-hydrates from JSON.

---

## 5. State transitions on accepting an applicant

```
Pending application on an open shift
        │
        ▼
[ click "Accept" on ApplicantRow ]
        │
        ▼
useShiftApplications.accept(appId)
   sugar over store; resolves staffId from auth
        │
        ▼
useApplicationsStore.accept(appId, staffId)
        │
        ├── 1) Mark target accepted: status='accepted',
        │      decidedAt + decidedByStaffId
        │
        ├── 2) Auto-decline OTHER pending applications
        │      for the same shift (status='declined' on each)
        │
        └── 3) useShiftsStore.update(shiftId, {
                  status: 'claimed',
                  claimedByProfessionalId,
                  claimedAt
              })
        │
        ▼
persistedstate plugin writes both stores to localStorage
        │
        ▼
Reactive recomputation:
  - PostedShiftCard re-renders, swaps applicant-count badge for
    "Claimed by [name]" pill
  - ShiftDetailView re-renders the Applications tab; rows now
    show ACCEPTED / DECLINED badges instead of action buttons
  - Cross-shift /facility/applications view updates counts
  - Sidebar "Applications" badge decrements
```

---

## 6. Out of scope (this prototype)

- Real authentication (no password hashing, no SSO, no email verification) — Phase A adds a facility-staff signup/login *flow* but submission is still mock
- Real backend / database — everything's localStorage
- Cross-device persistence
- Editing claimed shifts — the Edit button is hidden once status === 'claimed'
- Withdrawing an application (after submitting) — not modelled; future professional-side concern
- Claimer detail / messaging — facility sees applicant name and message but can't message back
- Notifications, payments, ratings
- Pagination — list sizes are small enough not to need it
- Image uploads, document verification

These are listed in the README's "What's next" so reviewers understand the scope intentionally.
