# WORKFLOW

How ShiftLink works end-to-end. Read this before building features so the user paths and data flows are clear.

---

## 1. User flow (the happy path)

```
                          USER ARRIVES
                               │
                               ▼
                    ┌────────────────────┐
                    │   /  LANDING       │
                    │                    │
                    │   Hero (forest)    │
                    │   Dual CTA         │
                    │   ┌──────┐ ┌─────┐ │
                    │   │ Pro  │ │ Fac │ │
                    │   └───┬──┘ └──┬──┘ │
                    └───────┼───────┼────┘
                            │       │
                  ┌─────────┘       └──────────┐
                  │                            │
                  ▼                            ▼
        ┌──────────────────┐         ┌──────────────────┐
        │ /signup          │         │ /signup          │
        │ ?type=professional│         │ ?type=facility  │
        │                  │         │                  │
        │ Pro fields:      │         │ Facility fields: │
        │ • Name           │         │ • Org name       │
        │ • Email          │         │ • Contact email  │
        │ • Role           │         │ • Facility type  │
        │ • Phone          │         │ • Location       │
        │ • Certifications │         │ • Phone          │
        │                  │         │                  │
        │ [ Submit ]       │         │ [ Submit ]       │
        └────────┬─────────┘         └────────┬─────────┘
                 │                            │
                 ▼                            ▼
        ┌──────────────────┐         ┌──────────────────┐
        │ AUTH SET         │         │ AUTH SET         │
        │ userType=        │         │ userType=        │
        │  'professional'  │         │  'facility_staff'│
        │ + persist to LS  │         │ + facilityId     │
        │                  │         │ + persist to LS  │
        │ → /shifts        │         │ → /facility      │
        └────────┬─────────┘         └────────┬─────────┘
                 │                            │                            │
                 │                            ▼
                 │              ┌────────────────────────────────┐
                 │              │ /facility   (route-guarded:     │
                 │              │              userType === 'fac')│
                 │              │                                 │
                 │              │ Header: "Your shifts"           │
                 │              │ [ Post a shift ] CTA → /facility│
                 │              │                  /shifts/new    │
                 │              │                                 │
                 │              │ My posted shifts list:          │
                 │              │  ┌─────────────────────────┐    │
                 │              │  │ RN • Mon 14 • $68/hr    │    │
                 │              │  │ ✓ Claimed               │    │
                 │              │  │           [⋯ delete]    │    │
                 │              │  └─────────────────────────┘    │
                 │              │  ┌─────────────────────────┐    │
                 │              │  │ EN • Sat 16 • $84/hr    │    │
                 │              │  │ ○ Open                  │    │
                 │              │  │           [⋯ delete]    │    │
                 │              │  └─────────────────────────┘    │
                 │              │                                 │
                 │              │ Empty state:                    │
                 │              │ "No shifts posted yet →         │
                 │              │   Post your first"              │
                 │              └──────┬──────────────────────────┘
                 │                     │ (click "Post a shift")
                 │                     ▼
                 │              ┌────────────────────────────────┐
                 │              │ /facility/shifts/new            │
                 │              │                                 │
                 │              │ Form fields:                    │
                 │              │ • Role (select)                 │
                 │              │ • Date                          │
                 │              │ • Start / end time              │
                 │              │ • Hourly rate                   │
                 │              │ • Notes (optional)              │
                 │              │                                 │
                 │              │ [ Cancel ]   [ Post shift ]     │
                 │              └──────┬──────────────────────────┘
                 │                     │ (submit)
                 │                     ▼
                 │              useShiftsStore.create({...})
                 │               • generates id                  │
                 │               • tags createdBy = facilityId   │
                 │               • status = 'open'               │
                 │               • persist to LS                 │
                 │                     │
                 │                     ▼
                 │              redirect → /facility (list)
                 │              new shift visible in list AND
                 │              visible to professionals on /shifts
                 │
                 ▼
        ┌──────────────────────────────────────────┐
        │ /shifts   (route-guarded:                 │
        │            userType === 'professional')   │
        │                                          │
        │ Guard reads useAuthStore.userType        │
        │ • null               → redirect to /     │
        │ • 'facility_staff'   → redirect to /     │
        │                        facility          │
        │ • 'professional'     → render below      │
        │                                          │
        │ ┌──────────────────────────────────────┐ │
        │ │ Filters                              │ │
        │ │  ┌─────────┐  ┌─────────────────┐    │ │
        │ │  │ Role  ▾ │  │ Date range      │    │ │
        │ │  └─────────┘  └─────────────────┘    │ │
        │ └──────────────────────────────────────┘ │
        │                                          │
        │ Card grid (responsive)                   │
        │ ┌───────────┐  ┌───────────┐             │
        │ │ Day shift │  │ Urgent    │             │
        │ │ RN        │  │ EN        │             │
        │ │ Bondi     │  │ R. Shore  │             │
        │ │ $68/hr    │  │ $84/hr    │             │
        │ │ [Claim]   │  │ [Claim]   │             │
        │ └───────────┘  └───────────┘             │
        │ ┌───────────┐  ┌───────────┐             │
        │ │ ...       │  │ ...       │             │
        │ └───────────┘  └───────────┘             │
        └──────┬───────────────────────────────────┘
               │ (click a card → detail page)
               │ OR
               │ (click "Claim" inline → quick claim)
               ▼
        ┌────────────────────────────────────┐
        │ /shifts/:id                        │
        │                                    │
        │ Full shift details                 │
        │ • Role, facility, location         │
        │ • Date, hours, rate                │
        │ • Description, requirements        │
        │                                    │
        │ Status: open  /  claimed-by-you    │
        │                                    │
        │ [ Claim shift ]   ← if open        │
        │ ✓ You claimed this   ← if claimed  │
        └──────┬─────────────────────────────┘
               │ (click Claim)
               ▼
        ┌────────────────────────────────────┐
        │ CLAIM ACTION (no nav)              │
        │                                    │
        │ useClaimsStore.claim(shiftId)      │
        │  → adds id to claimedShiftIds[]    │
        │  → persistedstate writes to LS     │
        └──────┬─────────────────────────────┘
               │
               ▼
        ┌────────────────────────────────────┐
        │ CONFIRMATION (in-place state)      │
        │                                    │
        │   ✓ Shift claimed                  │
        │                                    │
        │   You're booked for:               │
        │   Thu 14 May  •  07:00–15:00       │
        │                                    │
        │   [ Back to shifts ]               │
        │                                    │
        │ Cards in /shifts now show          │
        │ "Claimed" badge for this id        │
        └────────────────────────────────────┘
```

---

## 2. Route map

```
                                   Vue Router
                                        │
   ┌───────────┬─────────┬──────────────┼─────────────┬────────────────────┬──────┐
   │           │         │              │             │                    │      │
   ▼           ▼         ▼              ▼             ▼                    ▼      ▼
   /          /signup   /shifts        /shifts/:id   /facility            /facility/    *
   │          │         │              │             │                    shifts/new
   │          │         professional   professional  facility_staff       facility_staff
   │          │         only           only          only                 only           404
   │          │         │              │             │                    │
   Landing    Signup    Shifts         ShiftDetail   FacilityDashboard    PostShift
   View       View      View           View          View                 View
   (landing   (signup   (shifts        (shifts       (facility            (facility
    module)    module)   module)        module)       module)              module)


  Guard logic (src/router/index.ts):

      ┌────────────────────────────────────────────────────┐
      │  beforeEach((to) => {                              │
      │    const auth = useAuthStore()                     │
      │    const required = to.meta.requiresUserType       │
      │    // UserType ('professional' | 'facility_staff') │
      │    //   or undefined for public routes             │
      │                                                    │
      │    if (required && !auth.isAuthenticated)          │
      │      return { path: '/' }                          │
      │                                                    │
      │    if (required && auth.userType !== required)     │
      │      return auth.userType === 'facility_staff'     │
      │        ? { path: '/facility' }                     │
      │        : { path: '/shifts' }                       │
      │  })                                                │
      └────────────────────────────────────────────────────┘
```

---

## 3. Data architecture

The flow of state from mock data → store → component.

```
┌──────────────────────────────────────────────────────────────────┐
│                         MOCK DATA LAYER                          │
│                                                                  │
│   src/data/shifts.ts          src/data/landing.ts                │
│   ────────────────             ─────────────────                 │
│   export const seedShifts:    export const landingCopy: ...      │
│     Shift[] = [...]           (hero text, audience copy,         │
│   (initial seed only —         trust signals)                    │
│    used to hydrate the                                           │
│    Pinia store on first                                          │
│    load if empty)                                                │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ imported by
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER (pure)                      │
│                                                                  │
│   src/modules/shifts/services/shiftService.ts                    │
│   ────────────────────────────────────────                       │
│   listOpenShifts(allShifts)     → Shift[]                        │
│   filterShifts(shifts, filters) → Shift[]                        │
│   getShiftById(allShifts, id)   → Shift | null                   │
│                                                                  │
│   src/modules/facility/services/PostShiftForm.ts                 │
│   ──────────────────────────────────────────                     │
│   validatePostShiftForm(values) → PostShiftFormErrors            │
│   buildShiftFromForm(values, facilityId) → Shift                 │
│                                                                  │
│   src/modules/signup/services/SignupForm.ts                      │
│   ───────────────────────────────────────                        │
│   validateSignupForm(values)    → SignupFormErrors               │
│   submitSignupForm(values)      → Promise<void>  (mock)          │
│                                                                  │
│   No Vue imports, no reactivity. Pure functions.                 │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ called by
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                          STATE LAYER                             │
│                                                                  │
│   Pinia stores (persisted)              Composables (transient)  │
│   ─────────────────────────             ──────────────────────   │
│                                                                  │
│   useAuthStore  (src/stores/auth.ts)    useSignupForm            │
│    • userType: 'pro'|'fac'|null          (per-form reactive      │
│    • facilityId: string|null              glue, not persisted)   │
│    • isAuthenticated                                             │
│    • loginAsProfessional()              usePostShiftForm         │
│    • loginAsFacility()                                           │
│    • logout()                           useShiftFilters          │
│    • persist: true ──→ localStorage      (filter state, list)    │
│                                                                  │
│   useShiftsStore  (src/stores/shifts.ts)  ★ NEW                  │
│    • shifts: Shift[]                                             │
│    • create(shift)         → adds to list                        │
│    • remove(id)            → deletes by id                       │
│    • myShifts(facilityId)  → computed, facility's own            │
│    • openShifts            → computed, status === 'open'         │
│    • hydrate(seed)         → on first load if empty              │
│    • persist: true ──→ localStorage                              │
│                                                                  │
│   useClaimsStore  (src/stores/claims.ts)                         │
│    • claimedShiftIds: string[]                                   │
│    • claim(id)                                                   │
│    • isClaimed(id)                                               │
│    • persist: true ──→ localStorage                              │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ consumed by
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                            UI LAYER                              │
│                                                                  │
│   Views                          Components                      │
│   ──────                         ──────────                      │
│   LandingView.vue                ShiftCard.vue                   │
│   SignupView.vue                 ShiftFilters.vue                │
│   ShiftsView.vue                 SignupForm.vue                  │
│   ShiftDetailView.vue            PostShiftForm.vue               │
│   FacilityDashboardView.vue ★    PostedShiftRow.vue ★            │
│   PostShiftView.vue ★            AudienceSection.vue             │
│                                  NavBar.vue                      │
│                                  SiteFooter.vue                  │
│                                                                  │
│   Templates + bindings only. No business logic.                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Persistence behaviour

| What | Where | Survives reload? | Survives device change? |
|---|---|---|---|
| `userType` + `facilityId` (auth) | Pinia + `localStorage` | ✅ Yes | ❌ No (LS is per-browser) |
| `claimedShiftIds` | Pinia + `localStorage` | ✅ Yes | ❌ No |
| **`shifts[]` (the source of truth)** | **Pinia + `localStorage`** | **✅ Yes** | **❌ No** |
| Signup form values | Composable (`ref`) | ❌ No (intentional) | ❌ No |
| Post-shift form values | Composable (`ref`) | ❌ No (intentional) | ❌ No |
| Filter state | Composable (`ref`) | ❌ No (intentional) | ❌ No |
| Seed shifts | `src/data/shifts.ts` | n/a (static) | n/a (only used to hydrate the store on first load) |

When a user closes the tab and returns, they are still "logged in" as the same audience and their claimed shifts are still claimed. When they open the site on a different device, they start fresh — this is a known prototype limitation, called out in the README's "what I'd do next" (move to Firebase Auth + Firestore).

---

## 5. State transitions on the claim action

```
   User on /shifts/:id, shift status = "open"
                       │
                       ▼
              [ click "Claim shift" ]
                       │
                       ▼
   useClaimsStore.claim(shiftId)
                       │
                       ▼
   ┌─────────────────────────────────────┐
   │ claimedShiftIds.value.push(shiftId) │
   └─────────────────┬───────────────────┘
                     │
                     │  (Pinia reactivity triggers)
                     ▼
   ┌─────────────────────────────────────┐
   │ Persistedstate plugin writes to LS:  │
   │ localStorage['claims'] = JSON.serial │
   └─────────────────┬───────────────────┘
                     │
                     │  (computed properties re-evaluate)
                     ▼
   ┌─────────────────────────────────────┐
   │ ShiftDetailView re-renders:         │
   │   isClaimed(shiftId) → true         │
   │   button → confirmation state       │
   │                                     │
   │ ShiftCard in /shifts re-renders:    │
   │   isClaimed(shiftId) → true         │
   │   shows "Claimed" badge             │
   └─────────────────────────────────────┘
```

---

## 6. Out of scope (this prototype)

- Real authentication (no password, no SSO, no email verification)
- Real backend / database
- Cross-device persistence
- **Edit a posted shift** — facility can post and delete, not edit
- **Roster / calendar view** — calendar-style scheduling is a different paradigm (manager-assigns model). ShiftLink is a marketplace (professional-claims model).
- **Claimer detail view** — facility sees "open" / "claimed" status, but no claimer name (mock auth means no real users to display)
- **Stats and analytics** — fill rate, average time-to-claim, charts
- Notifications, messaging, payments
- Search beyond the simple filters
- Pagination (mock data is small enough not to need it)
- Image uploads, document verification

These are documented as "what I'd do next" in the README.
