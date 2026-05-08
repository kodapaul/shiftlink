# WORKFLOW

How ShiftLink works end-to-end as it stands today. The professional-side flow + public landing are pending; everything below describes the **facility-side** experience and the underlying data model.

---

## 1. User flow (facility-side)

```
                        Visitor lands on /
                                │
                                ▼
                   Auto-redirect to /facility
                                │
                                ▼
         ┌──────────────────────────────────────────┐
         │ FacilityLayoutView                       │
         │  - Hydrates shifts + applications stores │
         │  - Auto-impersonates demo facility staff │
         │    (Sarah Whitfield) until Phase A wires │
         │    real signup/login                     │
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
```

Every store mutation persists to localStorage so the demo state sticks across reload.

---

## 2. Route map

```
                                Vue Router
                                     │
   /             /facility       /facility/      /facility/      /facility/        /facility/
   (redirects)   (dashboard)     shifts/new      shifts/:id      shifts/:id/edit   applications
                                                 (detail tabs)                     (triage)
                                                                                        │
                                                                                  /facility/map
                                                                                  (split list+map)
```

Guards (`src/router/index.ts`): `/facility/*` requires `userType === 'facility_staff'`. Until Phase A lands real auth, the layout view auto-impersonates so unauth visits don't 404.

Phase A will add `/login`, `/signup`, `/facility/onboarding`. Phase B will add `/shifts` and `/shifts/:id` (professional side).

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
| `userType` + `userId` + `facilityId` (auth) | Pinia + localStorage | ✅ | ❌ (per-browser) |
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
