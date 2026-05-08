# TODOS

Waterfall build plan. Work top-to-bottom — do not skip phases. Check items off as you complete them. Each phase has a definition of "done" — meet it before moving on.

**Build order rationale:** the landing page is the last build phase before deploy. Reasoning: (1) it's the most polish-heavy surface, (2) we want it to reflect the actual product (post-shift, claim flow, dashboard) once those exist, not placeholders, (3) saving it for the end means polish budget is unconstrained.

---

## Phase 0 — Project setup

- [x] Scaffold Vue 3 + TS + Vite + Vue Router via `npm create vue@latest`
- [x] Configure dev server port (5176) in `vite.config.ts`
- [x] Install Tailwind CSS **v4** + `@tailwindcss/vite` (switched from v3 — v4 is what shadcn-vue@latest expects)
- [x] Configure brand tokens in `src/assets/main.css` (`@theme` block, palette, radius, fonts) per BRAND.md
- [x] Install Pinia + `pinia-plugin-persistedstate`, register in `src/main.ts`
- [x] Add Google Fonts via `@import` in `main.css` for Fraunces + Inter
- [x] Replace default Vue welcome content with theme-preview `App.vue`
- [x] Initialize shadcn-vue with our CSS variables (`components.json`, `src/lib/utils.ts`)
- [x] Override CSS variables in `src/assets/main.css` per BRAND.md (forest, cream, marigold, blush, sage, mist, ink)
- [x] Add Button + Card components via shadcn-vue
- [x] Override Button to add `cursor-pointer` (documented in DOCUMENTATIONS.md)
- [ ] Set up git repo (`git init`), first commit
- [ ] Push to GitHub (create repo, set remote, push `main`)
- [ ] Initialize Firebase Hosting (`firebase init hosting`) with `dist/` as public dir, SPA rewrite enabled
- [ ] First production deploy (`npm run build && firebase deploy`) — confirm pipeline works end-to-end *before* writing more code
- [ ] Add live URL to README.md

**Done when:** `npm run dev` shows the theme preview correctly, AND `firebase deploy` produces a live URL with the same page rendering. _(Currently deferred per user — will revisit before Phase 10.)_

---

## Phase 1 — Foundation

> Note: shadcn-vue covers `Button` and `Card`. Hand-rolling base primitives is only for things shadcn-vue doesn't cover — layout wrappers and app chrome.

- [ ] Create folder structure per CONFIGURATIONS.md: `src/{components,composables,helpers,data,stores,modules}/`
- [ ] Build layout primitives in `src/components/`:
  - [ ] `BaseSection.vue` — full-width wrapper with vertical padding tokens (96–192px)
  - [ ] `BaseContainer.vue` — max-width content wrapper (`max-w-screen-xl`) with horizontal gutter
- [ ] Build app chrome in `src/components/`:
  - [ ] `NavBar.vue` — logo + login state CTA (reads `useAuthStore`)
  - [ ] `SiteFooter.vue` — minimal footer with brand mark and copyright
- [ ] Add base typography helper classes in `src/assets/main.css` if needed (display, lead, caption — beyond what `@theme` already provides)
- [ ] Verify all components render correctly on mobile (375px) and desktop (1280px)

**Done when:** A test page can compose Section + Container + NavBar + SiteFooter with shadcn Button/Card and match BRAND.md visually on mobile and desktop.

---

## Phase 2 — Routing skeleton + auth store

- [ ] Implement `useAuthStore` (`src/stores/auth.ts`) with `persist: true`:
  - [ ] State: `userType: 'professional' | 'facility' | null`, `facilityId: string | null`
  - [ ] Getter: `isAuthenticated`
  - [ ] Actions: `loginAsProfessional()`, `loginAsFacility()` (also generates `facilityId`), `logout()`
- [ ] Define routes in `src/router/index.ts`:
  - [ ] `/` → LandingView (public)
  - [ ] `/signup` → SignupView (public, accepts `?type=professional|facility`)
  - [ ] `/shifts` → ShiftsView (`requiresUserType: 'professional'`)
  - [ ] `/shifts/:id` → ShiftDetailView (`requiresUserType: 'professional'`)
  - [ ] `/facility` → FacilityDashboardView (`requiresUserType: 'facility'`)
  - [ ] `/facility/shifts/new` → PostShiftView (`requiresUserType: 'facility'`)
  - [ ] `/:pathMatch(.*)*` → NotFoundView
- [ ] Stub out empty views for each route
- [ ] Implement route guard:
  - [ ] Unauthenticated + protected → redirect `/`
  - [ ] Wrong audience + protected → redirect to user's correct landing (`/shifts` or `/facility`)
- [ ] Confirm navigation works across all routes

**Done when:** Each route loads its stub view, guards redirect correctly for all three states (anon, professional, facility).

---

## Phase 3 — Sign-up flow (`src/modules/signup/`)

- [ ] Define types — `SignupFormBase`, `ProfessionalSignupForm`, `FacilitySignupForm` (discriminated union)
- [ ] Define enums — `Role` (RN, EN, AIN, Carer, etc.), `FacilityType`, `AudienceType`
- [ ] Validation service in `services/SignupForm.ts`
- [ ] Build `useSignupForm` composable with `values`, `errors`, `touched`, `status`
- [ ] Build the form UI:
  - [ ] Audience pre-selection (read from `?type=`; show audience picker if missing)
  - [ ] Branched fields based on audience
  - [ ] Submit handler — `console.log` + show success state (mock)
- [ ] On successful submit:
  - [ ] Professional → `useAuthStore.loginAsProfessional()` → redirect to `/shifts`
  - [ ] Facility → `useAuthStore.loginAsFacility()` (also generates `facilityId`) → redirect to `/facility`
- [ ] Update DOCUMENTATIONS.md

**Done when:** Both branches submit cleanly with validation, both branches actually log the user in and route to the correct authenticated view.

---

## Phase 4 — Shifts store (shared infrastructure) ✅

> Wires the source-of-truth store that both `/shifts` (professional) and `/facility` (facility) read from.

- [x] Define `Shift` interface in `src/modules/shifts/types/Shift.ts`
- [x] Define `ShiftStatus`, `Urgency`, `ShiftType` enums in `src/modules/shifts/enums/`
- [x] Author `src/data/shifts.json` — 121 shifts via generator script (`npm run data:shifts`)
- [x] Build `useShiftsStore` (`src/stores/shifts.ts`) with persist:
  - [x] State: `shifts: Shift[]`
  - [x] Action: `hydrateIfEmpty()`
  - [x] Action: `resetToSeed()`
  - [x] Action: `create(input)`
  - [x] Action: `remove(id)`
  - [x] Action: `shiftsForFacility(facilityId)`
  - [x] Getter: `openShifts`
  - [x] Action: `getById(id)`
- [x] Wire hydration in `App.vue` `onMounted`
- [x] Update DOCUMENTATIONS.md

---

## Phase 5 — Facility dashboard (`src/modules/facility/`) ✅

- [x] Define types — `PostShiftFormValues`, `PostShiftFormErrors`, `PostShiftFormStatus`
- [x] Build service — `validatePostShiftForm`, `buildShiftDraft(values, facilityId, staffId)`, `defaultTimesForShiftType`
- [x] Build composable — `usePostShiftForm()`
- [x] Build views:
  - [x] `FacilityLayoutView.vue` — sidebar shell wrapping `<RouterView />`
  - [x] `FacilityDashboardView.vue` at `/facility` — greeting, "Post a shift" CTA, filter tabs, posted-shift list, empty states
  - [x] `PostShiftView.vue` at `/facility/shifts/new` — page wrapper for the form
- [x] Build components:
  - [x] `FacilitySidebar.vue` — forest-green sidebar (shadcn-vue Sidebar primitive, themed)
  - [x] `PostedShiftCard.vue` — shift list item with status pill, role title, date/time/rate, delete action
  - [x] `PostShiftForm.vue` — branched, validated form
  - [x] `ShiftStatusBadge.vue` — sage / blush / mist pills based on status × urgency
- [x] Wire delete action with confirmation (shadcn-vue Dialog)
- [x] Auth store stub (`useAuthStore`) with `loginAsFacility()` for prototype access
- [x] Router with facility-only guard
- [x] Update DOCUMENTATIONS.md

---

## Phase 6 — Shift board (`src/modules/shifts/`)

> Models and store now live in Phase 4. This phase consumes them and renders the professional-side UI.

- [ ] Build `shiftService.ts` — pure helpers: `filterShifts(shifts, filters)`, etc. (read-only — store does the writes)
- [ ] Build `useShiftFilters` composable — local reactive filter state (role, date range)
- [ ] Build `ShiftCard.vue` component (per BRAND.md: flat, generous padding, typographic hierarchy, pill status tag)
- [ ] Build filter UI — by role, by date range
- [ ] Build `ShiftsView.vue` — pulls from `useShiftsStore.openShifts`, applies filters, renders grid; shows "Claimed" badge when `useClaimsStore.isClaimed(id)`
- [ ] Build `ShiftDetailView.vue` — full details, claim CTA
- [ ] Update DOCUMENTATIONS.md

**Done when:** Shifts render in a card grid, filters update results client-side, layout is responsive, claimed shifts are visually distinguished.

---

## Phase 7 — Claim flow

- [ ] Implement `useClaimsStore` Pinia store in `src/stores/claims.ts` with `persist: true` (`claimedShiftIds: string[]`, `claim(id)`, `isClaimed(id)`)
- [ ] Add "Claim shift" CTA on `ShiftCard` and on `ShiftDetailView`
- [ ] Implement claim action — update store state + persist
- [ ] Build confirmation state — visual change on the card + dedicated confirmation view or inline banner
- [ ] Show "Claimed" badge on already-claimed shifts in the list
- [ ] When a professional claims, also update `useShiftsStore` so the shift's `status` flips to `'claimed'` (so the facility dashboard reflects it)
- [ ] Persist across reload — verify by claiming + refreshing
- [ ] Update DOCUMENTATIONS.md

**Done when:** Claiming works, confirmation is visually clear, state survives a refresh, the facility's dashboard shows the shift as claimed.

---

## Phase 8 — Polish

- [ ] Full responsive audit (375px, 768px, 1024px, 1440px)
- [ ] Keyboard navigation audit — every interactive element reachable, focus visible
- [ ] Empty states (no shifts match filters; facility has no posted shifts)
- [ ] Loading states (even for mock — fake a brief delay if useful)
- [ ] Microcopy pass — no buzzwords, specific numbers, addresses the user
- [ ] 404 route
- [ ] Page titles per route
- [ ] Favicon (simple monogram)
- [ ] Cross-browser smoke test (Chrome, Safari, Firefox)

**Done when:** No obvious rough edges, design checklist in BRAND.md passes for all authenticated views.

---

## Phase 9 — Landing page (`src/modules/landing/`)

> Last build phase. Done after every other view exists so the landing reflects the real product, and so polish budget on the most-graded surface is unconstrained.

- [ ] Define types in `types/` — `AudienceType` enum (or import from signup), content prop shapes
- [ ] Author landing copy in `src/data/landing.ts`
- [ ] Build hero with dual CTA (links to `/signup?type=professional` and `/signup?type=facility`)
- [ ] Build symmetric audience sections (professional + facility) — parallel structure, different verbs (empowerment for pros, efficiency for facilities)
- [ ] Build trust row (specific facility count, logo placeholders)
- [ ] Build closing CTA / footer
- [ ] Responsive pass — mobile, tablet, desktop
- [ ] Final design pass per BRAND.md checklist
- [ ] Update DOCUMENTATIONS.md with the landing module entry

**Done when:** Landing page is visually polished, dual CTAs route correctly, layout works on all breakpoints, hits the eucalyptus-inspired register convincingly.

---

## Phase 10 — Deploy

- [ ] If skipped earlier: `git init`, push to GitHub, `firebase init hosting`, first deploy
- [ ] Final `npm run build` — fix any TS or build errors
- [ ] `firebase deploy`
- [ ] Open the live URL on mobile + desktop, verify everything works
- [ ] Update README.md with the live URL
- [ ] Confirm GitHub repo is accessible to reviewers and `main` branch is deploy-clean

**Done when:** Live URL is in README, last commit on `main` matches what's deployed.

---

## Phase 11 — Submission package

- [ ] README.md complete — setup, stack, tradeoffs, live URL
- [ ] "What's next" note (3–5 sentences) added to README
- [ ] Final commit + push
- [ ] Submit GitHub link + live URL + next-steps note to the brief sender

**Done when:** Submission email is sent.
