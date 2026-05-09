# ShiftLink

A two-sided marketplace prototype for healthcare shift coverage. Facilities post shifts, professionals apply, facility staff accepts the right applicant — front-end only, no real backend.

> Built as a take-home exercise. Eucalyptus.health-inspired visual register; upaged.com-inspired information architecture.

**Live URL:** _to be added after first deploy_

---

## Status

Both sides of the marketplace are functional end-to-end, plus the public marketing landing. The remaining gap is deployment.

### Brief requirements

| Brief requirement | Where it lives | Status |
|---|---|---|
| Public landing page with dual CTA, trust signals, value props per audience | `src/views/HomeView.vue` | ✅ Complete |
| Sign-up flow that branches by user type | `/register` (professional), `/staff/registration` (facility) | ✅ Complete |
| Authenticated shift board with role / facility / date / time / rate per card + filters | `/shifts` (`src/modules/shifts/views/ShiftsBrowseView.vue`) | ✅ Complete |
| Shift claim with confirmation state | `ShiftApplyDialog` + `applications` store | ✅ Complete |
| Responsive design | `375px` audited across every view | ✅ Complete |

### Bonus surfaces

| Area | Status |
|---|---|
| Facility portal — list, post, edit, delete shifts | ✅ Complete |
| Shift detail view with Overview / Applications tabs | ✅ Complete |
| Per-shift application accept/decline (auto-claims shift, auto-declines competitors) | ✅ Complete |
| Cross-shift applications triage view | ✅ Complete |
| Sydney shift map with split list + click-to-fly | ✅ Complete |
| Professional dashboard with Profile / Applications / Schedule tabs + dedicated edit page | ✅ Complete |
| Rich-text notes (Tiptap) + sanitized renderer for shift descriptions | ✅ Complete |
| Custom 12-hour AM/PM time picker, shadcn-vue date picker, themed tabs / sheets / dialogs | ✅ Complete |
| Mock data for 1 facility · 5 staff · 10 professionals · 121 shifts · ~260 applications | ✅ Complete |
| Persisted to `localStorage` via Pinia plugin (CRUD + edits survive reload) | ✅ Complete |
| Contact form with Sydney map + thank-you transition (no real submission) | ✅ Complete |
| Hash-anchor navigation (header About / Contact scrolls home page sections) | ✅ Complete |
| Production deploy | ⏳ Pending |

## What's in here

- **Public landing** at `/` — editorial cream-on-cream layout with a hero, For-Professionals split, For-Facilities mirrored split, six-card testimonials with brand-tinted variants, About bento with stats, Contact form + Leaflet map, and a closing CTA + footer.
- **Professional side** at `/professional` — three-tab dashboard (Profile, Applications, Schedule) + dedicated profile-edit at `/professional/edit`. Browse/apply via `/shifts`.
- **Facility portal** at `/facility` — Sidebar nav: All posted shifts · Post a shift · Applications · Shift map. Five demo staff at the seeded facility (St. Vincent's Aged Care, Bondi).
- **Single-facility model.** Every shift implicitly belongs to the one demo facility, but each shift carries its own optional `location` and `lat`/`lng` to reflect that real facilities have many physical sites.
- **Application lifecycle** — pending → accepted (which auto-claims the shift and auto-declines competing pendings) or → declined. Cross-store side effects centralized in the applications store.

## Stack

| Layer | Choice |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript (strict, no `any`) |
| Build tool | Vite 8 |
| Routing | Vue Router 4 |
| Styling | Tailwind CSS v4 (CSS-based config) |
| Component primitives | shadcn-vue (themed away from defaults — see [docu/BRAND.md](docu/BRAND.md)) |
| State | Pinia + `pinia-plugin-persistedstate` |
| Map | Leaflet + CartoDB Voyager tiles (no API key) |
| Date / time | shadcn-vue Calendar + `@internationalized/date` for the date picker; custom 12-hour time picker |
| Hosting (planned) | Firebase Hosting (SPA) |

See [docu/CONFIGURATIONS.md](docu/CONFIGURATIONS.md) for the architectural rules and folder layout, and [docu/BRAND.md](docu/BRAND.md) for the design system.

## Architecture

Modular by feature/domain. Every module owns its own `types/`, `enums/`, `services/`, `composables/`, `components/`, `views/`. Cross-cutting state lives in top-level `src/stores/`; cross-cutting helpers live in `src/helpers/`.

```
src/
├── assets/                       global CSS, fonts
├── components/                   shared UI: TimePicker, ShiftMap, shadcn-vue/ui
├── helpers/                      pure formatters (date, time, rate, time-ago)
├── data/                         mock seed JSON: facilities, facilityStaff,
│                                                 professionals, shifts,
│                                                 applications
├── stores/                       Pinia stores: auth, shifts, applications
├── router/                       Vue Router config + guards
├── modules/
│   ├── user/                     base User type, UserType enum
│   ├── professional/             Professional entity + Role enum
│   ├── facility/                 Facility + FacilityStaff + facility-side
│   │                             portal views, components, composables
│   ├── shifts/                   Shift entity + status/urgency/type enums
│   └── applications/             ShiftApplication entity + ApplicationStatus
│                                 enum + service + composables + components
├── App.vue
└── main.ts
```

The four-layer pattern (component → composable → store → service) is documented in [docu/CONFIGURATIONS.md](docu/CONFIGURATIONS.md). Every form (post-shift, edit-shift) follows it.

## Getting started

### Prerequisites

- Node.js 20.19+ (or 22.12+)
- npm 9+

### Install and run

```bash
git clone <repo-url>
cd shiftlink
npm install
npm run dev
```

Then open http://localhost:5176/. The root path renders the public landing page; the header has Login buttons for both audiences.

### Demo accounts

Mock auth — any password ≥ 6 chars works. To sign in quickly:

- **Professional** at `/login` — try `maya.patel@example.com` (the login page lists 5 demo professionals to copy from).
- **Facility staff** at `/staff/login` — try `sarah@stvincents-bondi.au` (Nurse Manager). Other seeded staff are listed inline.

New accounts created via the registration flows persist alongside the seed accounts in `localStorage`.

### Type-check, lint, build

```bash
npm run type-check
npm run lint
npm run build
```

Build output goes to `dist/`.

### Mock data scripts

The 121 shifts and ~260 applications in `src/data/` are generated, not hand-written. To regenerate (different random sample each run):

```bash
npm run data:shifts          # rewrites src/data/shifts.json
npm run data:applications    # rewrites src/data/applications.json
npm run data:all             # both, in order (apps depend on shifts)
```

Generators live in `scripts/` and read referenced records out of the seed JSON so foreign keys stay valid.

### Resetting the demo

The Pinia stores persist to `localStorage`, so any edits, posts, deletes, accepts persist across reload. To reset to fresh seed data: open DevTools → Application → Storage → Clear. Next reload will re-hydrate from the JSON.

## Tradeoffs and decisions

- **Vue over React.** Familiarity wins on a short timeline. Both meet the requirements equally well.
- **SPA, not SSR.** No SEO requirement; auth-gated views don't benefit from server rendering.
- **`localStorage` over a real backend.** The brief explicitly blesses mock data. Time spent setting up Supabase / Firebase Auth is time not spent on the design execution that's weighted equally with functionality.
- **Pinia + `pinia-plugin-persistedstate`.** Replaces ~15 lines of manual `JSON.parse`/`stringify` per piece of persisted state with `persist: true`. Cross-store side effects (e.g. accepting an application flips the linked shift to claimed) live in the store, not in components.
- **shadcn-vue, heavily themed.** Used for components where accessibility is hard to get right (Dialog, Popover, Select, Tabs, Sidebar, Sheet). Custom components (TimePicker, ShiftMap, status pills) are hand-rolled. CSS variables in `main.css` override the shadcn defaults to a vibrant eucalyptus palette: forest, cream, bone, ink, marigold, blush, sage, mist.
- **Editorial typography over SaaS density.** Type pairing (Fraunces + Inter), generous radius (12–24px), no drop shadows.
- **Single-facility model.** Multi-facility is over-modeling for a prototype. Shifts implicitly belong to the one facility; their per-shift `location` + `lat`/`lng` reflect that the facility serves multiple physical sites.
- **Cards over tables.** More responsive, more visually flexible, aligned with the editorial language.
- **Leaflet + CartoDB Voyager** instead of Google Maps / Mapbox. No API key, no quota, soft tiles that match the brand palette.
- **Custom TimePicker** instead of native `<input type="time">`. The native picker is browser-inconsistent and doesn't match the rest of the form's polish.

## What I'd do next (one more day)

If I had another day on this prototype, I'd swap `localStorage` for Firebase Auth + Firestore with security rules so sessions and posts survive across devices instead of being browser-local. I'd geocode free-text shift locations on submit (Nominatim or Google Geocoding) so user-posted shifts pin on the same map as the seeded ones — currently new shifts get a randomised Sydney coordinate. I'd write tests around the highest-risk flows: accept/decline cross-store mutations, edit-shift round-trip, registration validation. I'd run a full keyboard / focus-ring audit and add per-route page titles + a favicon. And I'd commission real photography for the landing — the For-Professionals and For-Facilities sections currently use a mix of stock photography and AI-generated imagery, which works for a prototype but reads as placeholder-ish in places.

## Documentation

- [CLAUDE.md](CLAUDE.md) — entry point for AI-assisted development (lists the rules below)
- [docu/CONFIGURATIONS.md](docu/CONFIGURATIONS.md) — architecture, folder structure, type-safety rules
- [docu/WORKFLOW.md](docu/WORKFLOW.md) — end-to-end user flows, route map, data architecture
- [docu/BRAND.md](docu/BRAND.md) — palette, typography, shadcn theming, component philosophy
- [docu/DOCUMENTATIONS.md](docu/DOCUMENTATIONS.md) — per-module docs index
- [docu/TODOS.md](docu/TODOS.md) — waterfall build plan with completed/remaining phases

## License

Take-home exercise. Source is public for review purposes; not licensed for redistribution.
