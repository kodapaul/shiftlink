# ShiftLink — Agent Instructions

This file is the entry point for any AI agent (Claude Code or otherwise) working on this repository. Read the referenced docs before writing code.

## Project

**ShiftLink** is a two-sided marketplace prototype connecting healthcare professionals with facilities that need on-demand shift coverage. Front-end only — no real backend. State is mocked via local files and `localStorage`.

## Required reading (in this order)

1. **[docu/CONFIGURATIONS.md](docu/CONFIGURATIONS.md)** — Stack, folder structure, type-safety rules, module workflow. Read before adding any file.
2. **[docu/WORKFLOW.md](docu/WORKFLOW.md)** — End-to-end user flows, route map, data architecture, state transitions. Read before building any feature so the big picture is clear.
3. **[docu/BRAND.md](docu/BRAND.md)** — Visual language (eucalyptus.health-inspired theme — colors/type/radius only, NOT layout), palette, typography, shadcn theming approach. Read before any UI work.
4. **[docu/TODOS.md](docu/TODOS.md)** — Waterfall build plan. Read before picking up work — pick the next unchecked item, do not skip phases.
5. **[docu/DOCUMENTATIONS.md](docu/DOCUMENTATIONS.md)** — Per-feature documentation index. Update when you add or change a feature.

## Hard rules

- **Stack is fixed:** Vue 3 + Composition API + `<script setup>` + TypeScript + Vite + Vue Router + Tailwind + shadcn-vue. Do not introduce alternatives without updating CONFIGURATIONS.md and getting approval.
- **Type-safe always.** No `any`. Define interfaces and types in the feature's `types/` folder before writing the component or service.
- **Modular per feature.** Every feature/module owns its own `types/`, `enums/`, `services/`, `components/`, `routes/`, and (if needed) `stores/`. See CONFIGURATIONS.md.
- **Models first.** Determine interfaces and data shapes before writing UI.
- **Reusable components live in `src/components/`** (shared) — feature-local components live inside the feature folder.
- **No real backend.** Mock data lives in `src/data/`. Persistence uses `localStorage`.
- **Design bar is editorial, not corporate.** Reference is eucalyptus.health, not a SaaS dashboard. See BRAND.md.

## Workflow expectations

- Update **TODOS.md** as you complete phases — check items off, do not delete.
- Update **DOCUMENTATIONS.md** when a feature is added or its contract changes.
- Do not modify CONFIGURATIONS.md or BRAND.md without explicit instruction — they are the source of truth.
