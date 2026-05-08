# TODOS

Build plan for the prototype. Reflects reality, not the original waterfall — the project ended up iterating into bonus features (edit shift, applications, map, rich text) ahead of the originally planned phases (real signup, professional board, landing).

---

## Done

The facility-side experience is complete end-to-end.

| Area | What works |
|---|---|
| **Setup** | Vue 3 + TS + Vite + Tailwind v4 + shadcn-vue + Pinia + persistedstate. Theme overrides (forest / cream / bone / ink / marigold / blush / sage / mist). Fraunces + Inter fonts. |
| **Domain** | Single-facility model. Modules: `user`, `professional`, `facility`, `shifts`, `applications`. Modular per-feature with `types/`, `enums/`, `services/`, `composables/`, `components/`, `views/`. |
| **Mock data** | 1 facility, 5 staff, 10 professionals, 121 shifts, ~265 applications. Generators in `scripts/`, `npm run data:all` to regenerate. |
| **Persistence** | All Pinia stores persist to localStorage. Edits / posts / deletes / accepts survive reload. |
| **Auth (stub)** | `useAuthStore` auto-impersonates the demo facility staff (Sarah Whitfield) when an unauth visitor hits `/facility`. **No real signup or login yet** — that's Phase A below. |
| **Facility portal** | Sidebar nav (All posted shifts · Post a shift · Applications · Shift map). Greeting header, search, status tabs, shift cards with applicant counts or claimer badge. |
| **Post / Edit / Delete shifts** | Full CRUD form with shadcn DatePicker, custom 12-hour AM/PM TimePicker, free-text role, optional location, marigold "Post shift" CTA, in-place edit at `/facility/shifts/:id/edit`, delete with confirmation Dialog. |
| **Shift detail page** | `/facility/shifts/:id` with Overview / Applications tabs. Default tab is Applications when there are pending. |
| **Applications system** | `applications` domain module with type, enum, service, store, composables, 4 reusable components. Per-shift list with accept/decline. Cross-shift triage view at `/facility/applications` with search + status tabs. Accept auto-claims the shift and auto-declines competing pendings. |
| **Shift map** | Leaflet + CartoDB Voyager tiles (no API key). Pins for all open / claimed shifts across Sydney. Split list-on-left + map-on-right view at `/facility/map` with click-to-fly. |
| **Rich text notes** | Tiptap-backed `RichTextEditor` (toolbar: bold, italic, h2, h3, bullet list, ordered list, link). DOMPurify-sanitized `RichTextRenderer` for display. Seed bank includes structured HTML notes. |

---

## Phase A — Login + Signup + Onboarding (facility)  ← NEXT

Replaces the current auto-impersonate hack with a real-feeling signup flow. The brief is mock-data only, so submission still doesn't hit a backend, but the *experience* should look like a real auth flow.

### Why now

The brief lists "branched sign-up" as one of the four required features. We have everything else but this. Every other view assumes a logged-in facility staff — making that explicit (rather than auto-impersonated) closes the loop.

### Scope

- [ ] Types in `src/modules/facility/types/`:
  - `LoginForm.ts` — email + password values, errors, status
  - `SignupForm.ts` — facility info + staff info values, errors, status
- [ ] Service layer (pure) in `src/modules/facility/services/`:
  - `LoginForm.ts` — `validateLoginForm`, `submitLoginForm` (mock; matches against seed staff emails)
  - `SignupForm.ts` — `validateSignupForm`, `buildStaffFromForm`
- [ ] Composables in `src/modules/facility/composables/`:
  - `useLoginForm()` — reactive glue + submit handler that calls `useAuthStore.loginAsFacility(staffId)`
  - `useSignupForm()` — reactive glue + submit handler that creates a new staff record (in-memory) and logs in
  - `useOnboarding()` — step state machine for the post-signup onboarding flow
- [ ] Auth store updates:
  - Replace `loginAsFacility()` (no-arg, auto-picks first) with `loginAsFacility(staffId)` (explicit)
  - Add `signUpAsFacility(input)` that creates a new staff record, hydrates auth, returns the created staff id
  - Add `logout()` that clears state and routes to `/login`
- [ ] Views in `src/modules/facility/views/`:
  - `LoginView.vue` at `/login`
  - `SignupView.vue` at `/signup`
  - `OnboardingView.vue` at `/facility/onboarding` — multi-step (welcome → facility info → invite staff stub → done)
- [ ] Routes:
  - Public: `/`, `/login`, `/signup`, `/facility/onboarding`
  - Protected (`requiresUserType: 'facility_staff'`): everything under `/facility/*` except `/onboarding`
  - Update `FacilityLayoutView` so it stops auto-impersonating and instead redirects unauth visitors to `/login`
- [ ] Components:
  - `OnboardingStepper.vue` — reusable step indicator
  - `LoginForm.vue` / `SignupForm.vue` — presentational, consume composables
- [ ] Smoke-test the full path: visit `/`, click Sign up, fill the form, see onboarding, land on `/facility`. Logout returns to `/login`.

### Out of scope for this phase

- Professional-side login/signup (deferred to the professional shift board phase)
- Real password hashing or any backend
- Forgot password / email verification

---

## Phase B — Professional shift board (`/shifts`)

The user-side counterpart. Reuses everything: `useShiftsStore`, `ShiftMap`, status badges, `RichTextRenderer`. New surface: shift list with filters, claim CTA on cards, my-claimed-shifts view.

- [ ] Routes: `/shifts` (browse), `/shifts/:id` (detail), `/shifts/my-claims` (deferred view from earlier — what a professional has claimed)
- [ ] Apply-to-shift flow: creates a `ShiftApplication` via `useApplicationsStore.apply()`
- [ ] Reuse the split list+map layout for the browse page
- [ ] Status filter + search

---

## Phase C — Polish

- [ ] Empty / loading / error states across every view
- [ ] Keyboard nav audit (focus rings, tab order)
- [ ] 404 route
- [ ] Page titles per route
- [ ] Favicon
- [ ] Cross-browser smoke (Chrome, Safari, Firefox)
- [ ] Mobile pass at 375px

---

## Phase D — Public landing page (`/`)

- [ ] Replace current root redirect with a real landing
- [ ] Hero with dual CTA (Sign up as Professional / Sign up as Facility)
- [ ] Parallel audience sections
- [ ] Trust row, closing CTA, footer
- [ ] Hits the eucalyptus visual register the brief asks for

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
