# ShiftLink

A two-sided marketplace prototype for healthcare shift coverage. Facilities post shifts, professionals apply, facility staff accepts the right applicant — front-end only, no real backend.

> Built as a take-home exercise. Eucalyptus.health-inspired visual register; upaged.com-inspired information architecture.

**Live URL:** [https://shiftlink-81e16.web.app](https://shiftlink-81e16.web.app)

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
| Page transitions (subtle fade + slide on every route change, reduced-motion-aware) | ✅ Complete |
| Production deploy on Firebase Hosting (multi-site under `pdv-website-7469f`) | ✅ Complete |

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
| Hosting | Firebase Hosting (SPA, multi-site target) |

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

### Deploying

Hosted on Firebase Hosting as a separate site under an existing project (`pdv-website-7469f` → site `shiftlink-81e16`). Wiring lives in `firebase.json` (target alias `shiftlink`) and `.firebaserc`. To redeploy:

```bash
npm run build
firebase deploy --only hosting:shiftlink
```

## Tradeoffs and decisions

- **Vue instead of React.** I know Vue better, so on a short timeline that mattered. Both could meet the brief equally well.
- **SPA, not SSR.** The app is mostly auth-gated, so server side rendering would not really pay off, and skipping it kept the setup simple.
- **localStorage instead of a real backend.** The brief said mock data was fine, so I went with that instead of spending time wiring up Firebase or Supabase.
- **Pinia with the persistedstate plugin.** Saves me from writing manual JSON parse / stringify wrappers everywhere. Cross-store side effects, like accepting an application also flipping the shift to claimed, live in the store, not the components.
- **shadcn-vue, heavily themed.** I used it for the parts where accessibility is hard to get right (Dialog, Popover, Select, Tabs, Sidebar, Sheet). Custom components like the TimePicker and ShiftMap I built from scratch. The CSS variables in main.css override the shadcn defaults to the eucalyptus palette.
- **Editorial typography over SaaS density.** Fraunces paired with Inter, generous radius, no drop shadows. The brief was clear about not wanting it to look like a Bootstrap template.
- **Single facility model.** A multi-facility setup felt like over-engineering for a prototype. Every shift belongs to the one demo facility, but it carries its own optional location and coordinates so it can still pin to different places on the map.
- **Cards over tables.** More responsive, more flexible on mobile, and a better fit for the editorial language.
- **Leaflet with CartoDB Voyager tiles.** No API key, no quota, and the soft warm tiles match the cream palette better than Google Maps or Mapbox would.
- **Custom TimePicker.** The native time input looks different across browsers and operating systems, and that inconsistency would have broken the rest of the form polish.

## What I'd do next

Personally, I want to see this app deployed and used by other people. If I had one more day, I would have added an SEO and server-side rendering, maybe utiliz technologies such as NuxtJs, Nextjs, or Astro. However, it would require a server setup, which would take time to deploy and optimize. If I had one more week, I would have added an authentication module and Firestore to simulate real user data. Maybe using Firebase Auth and Firestore would be enough for it to be an MVP. In addition, I would have used a more reliable map discovery feature. If I had one more month, I would set up a VPS to deploy Redis, observability, SQL, a search engine, and a backend using Node, Express, or Laravel to process real user requests and real data. If I had one year, I would have deployed it and added richer features like LLM features, a chatbot, event-driven features, AI matching, and a mobile app.

## Documentation

- [CLAUDE.md](CLAUDE.md) — entry point for AI-assisted development (lists the rules below)
- [docu/CONFIGURATIONS.md](docu/CONFIGURATIONS.md) — architecture, folder structure, type-safety rules
- [docu/WORKFLOW.md](docu/WORKFLOW.md) — end-to-end user flows, route map, data architecture
- [docu/BRAND.md](docu/BRAND.md) — palette, typography, shadcn theming, component philosophy
- [docu/DOCUMENTATIONS.md](docu/DOCUMENTATIONS.md) — per-module docs index
- [docu/TODOS.md](docu/TODOS.md) — waterfall build plan with completed/remaining phases

## License

Take-home exercise. Source is public for review purposes; not licensed for redistribution.
