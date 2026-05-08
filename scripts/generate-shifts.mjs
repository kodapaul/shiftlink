#!/usr/bin/env node
/**
 * Generate src/data/shifts.json — 121 plausible Shift records.
 *
 * Single-facility prototype: all shifts implicitly belong to the one facility
 * in src/data/facilities.json. Shifts no longer carry a `facilityId` — the
 * `postedByStaffId` (which is itself tied to that facility's staff) is the
 * only link we keep on each shift.
 *
 * Reads existing seed data so foreign keys are valid:
 *   - postedByStaffId     → from src/data/facilityStaff.json
 *   - claimedByProfessionalId (when status === 'claimed') → from src/data/professionals.json
 *
 * Run with: npm run data:shifts
 *
 * Notes
 * ─────
 * • `role` is free-text (matching the form). Mix of variants like
 *   "Registered Nurse — Acute Care" / "AIN — Memory Care" to feel like real
 *   human input rather than enum values.
 * • Each shift gets `lat`/`lng` from one of several Sydney metro suburbs
 *   (with ±0.005° jitter) so the map view shows shifts spread organically
 *   across the city — reflecting that one facility can post shifts at many
 *   physical sites.
 * • Math.random() is not seeded — each run produces different data.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '..', 'src', 'data')
const outputPath = path.join(dataDir, 'shifts.json')

const SHIFT_COUNT = 121

// ── Load referenced data ─────────────────────────────────────────────────────

const staff = JSON.parse(await fs.readFile(path.join(dataDir, 'facilityStaff.json'), 'utf8'))
const professionals = JSON.parse(
  await fs.readFile(path.join(dataDir, 'professionals.json'), 'utf8'),
)

if (!staff.length) {
  console.error('[generate-shifts] No facility staff found in facilityStaff.json')
  process.exit(1)
}

const staffIds = staff.map((s) => s.id)

// ── Distributions ────────────────────────────────────────────────────────────

/** Weighted random pick. `items` is `[{ weight, ...rest }]`. Returns the picked item. */
function weighted(items) {
  const total = items.reduce((sum, it) => sum + it.weight, 0)
  let r = Math.random() * total
  for (const it of items) {
    r -= it.weight
    if (r <= 0) return it
  }
  return items[0]
}

/**
 * Roles are free text now (matches the form). Hourly rate range is per role
 * variant — speciality titles trend slightly higher.
 */
const ROLES = [
  { weight: 25, label: 'Registered Nurse',                       rates: [60, 80] },
  { weight: 5,  label: 'Registered Nurse — Acute Care',          rates: [65, 85] },
  { weight: 5,  label: 'Registered Nurse — Mental Health',       rates: [62, 82] },
  { weight: 3,  label: 'Registered Nurse — Palliative Care',     rates: [62, 82] },
  { weight: 17, label: 'Enrolled Nurse',                         rates: [48, 62] },
  { weight: 3,  label: 'Enrolled Nurse — Med-Surg',              rates: [50, 64] },
  { weight: 21, label: 'Assistant in Nursing',                   rates: [35, 45] },
  { weight: 4,  label: 'Assistant in Nursing — Memory Care',     rates: [37, 47] },
  { weight: 7,  label: 'Carer',                                  rates: [32, 42] },
  { weight: 5,  label: 'Aged Care Carer',                        rates: [33, 43] },
  { weight: 5,  label: 'Midwife',                                rates: [65, 85] },
]

const SHIFT_TYPES = [
  { weight: 50, label: 'day' },
  { weight: 30, label: 'evening' },
  { weight: 20, label: 'night' },
]

const STATUSES = [
  { weight: 70, label: 'open' },
  { weight: 30, label: 'claimed' },
]

const URGENCIES = [
  { weight: 85, label: 'standard' },
  { weight: 15, label: 'urgent' },
]

// Times by shift type — [startTime, endTime] in 'HH:mm'. Night crosses midnight.
const TIMES_BY_TYPE = {
  day: ['07:00', '15:00'],
  evening: ['15:00', '23:00'],
  night: ['23:00', '07:00'],
}

// Optional per-shift sub-location hints (e.g. ward / wing within a facility).
// ~40% of shifts get one of these; the rest leave it unset.
const LOCATION_HINTS = [
  'ICU · Building B',
  'Acute Ward, Level 3',
  'Memory Care wing',
  'Geriatric — North wing',
  'Emergency · Bay 4',
  'Ward 7',
  'Day Surgery',
  'Outpatients',
  'Palliative Care wing',
  'Mental Health · Adult Inpatient',
  'Maternity · Birthing Suite 2',
  'Step-down Unit',
]

// Sydney metro suburbs the facility serves. Each shift picks one randomly,
// then gets ±0.005° jitter on top so pins don't all land in a single spot.
// All real AU coordinates, all comfortably inside the Sydney region.
const SYDNEY_AREA_COORDS = [
  { lat: -33.8915, lng: 151.2767 }, // Bondi
  { lat: -33.8225, lng: 151.1947 }, // St Leonards
  { lat: -33.8853, lng: 151.2117 }, // Surry Hills
  { lat: -34.0563, lng: 151.1525 }, // Cronulla
  { lat: -33.7969, lng: 151.2839 }, // Manly
  { lat: -33.8688, lng: 151.2093 }, // Sydney CBD
  { lat: -33.8915, lng: 151.1782 }, // Marrickville
  { lat: -33.8166, lng: 151.0024 }, // Parramatta
  { lat: -33.7688, lng: 151.2531 }, // Mosman
  { lat: -33.9173, lng: 151.0991 }, // Bankstown
]

// A small bank of plausible notes — most shifts have none.
const NOTE_BANK = [
  'Familiar with PRN medication administration preferred.',
  'Please bring your own scrubs and stethoscope.',
  'Handover at start of shift — arrive 10 min early.',
  'High-acuity ward — recent acute experience preferred.',
  'Aged-care experience required.',
  'Mental Health First Aid certification required.',
  'Palliative care experience strongly preferred.',
  'Bondi parking is limited — public transport recommended.',
  'Step-down from ICU patient cohort.',
  'Bring evidence of current immunisations.',
]

// ── Helpers ──────────────────────────────────────────────────────────────────

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const randomFloat = (min, max) => min + Math.random() * (max - min)

/** Pad a number to two digits ('04', '15'). */
const pad2 = (n) => String(n).padStart(2, '0')

/** Add `days` days to a Date and return YYYY-MM-DD (local). */
function dateNDaysFromNow(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** A random ISO timestamp some hours/days ago, before the shift date. */
function randomCreatedAt(shiftDateStr) {
  const shiftDate = new Date(`${shiftDateStr}T08:00:00Z`)
  const daysBefore = randomInt(1, 10)
  const hour = randomInt(8, 18)
  const minute = randomInt(0, 59)
  const created = new Date(shiftDate.getTime() - daysBefore * 86400000)
  created.setUTCHours(hour, minute, 0, 0)
  return created.toISOString()
}

/** Random claim time — between createdAt and the shift date. */
function randomClaimedAt(createdAtIso, shiftDateStr) {
  const start = new Date(createdAtIso).getTime()
  const end = new Date(`${shiftDateStr}T00:00:00Z`).getTime()
  const span = Math.max(end - start, 60000)
  return new Date(start + Math.floor(Math.random() * span)).toISOString()
}

/** Random Sydney-area coordinate with ~500m jitter from the picked suburb. */
function randomSydneyCoords() {
  const base = pickRandom(SYDNEY_AREA_COORDS)
  return {
    lat: +(base.lat + randomFloat(-0.005, 0.005)).toFixed(6),
    lng: +(base.lng + randomFloat(-0.005, 0.005)).toFixed(6),
  }
}

// ── Generate ─────────────────────────────────────────────────────────────────

const shifts = []

for (let i = 0; i < SHIFT_COUNT; i++) {
  const postedByStaffId = pickRandom(staffIds)

  const role = weighted(ROLES)
  const shiftType = weighted(SHIFT_TYPES).label
  const status = weighted(STATUSES).label
  const urgency = weighted(URGENCIES).label

  const [startTime, endTime] = TIMES_BY_TYPE[shiftType]

  const [rateMin, rateMax] = role.rates
  const baseRate = randomInt(rateMin, rateMax)
  const hourlyRate = urgency === 'urgent' ? baseRate + 10 : baseRate

  const dayOffset = randomInt(0, 20)
  const date = dateNDaysFromNow(dayOffset)

  const createdAt = randomCreatedAt(date)
  const coords = randomSydneyCoords()

  const shift = {
    id: `sh_${pad2(Math.floor(i / 100))}${pad2(i % 100)}`.replace(/^sh_00/, 'sh_'),
    postedByStaffId,
    role: role.label,
    date,
    startTime,
    endTime,
    hourlyRate,
    shiftType,
    status,
    urgency,
    createdAt,
    lat: coords.lat,
    lng: coords.lng,
  }

  // ~40% of shifts have a sub-location hint.
  if (Math.random() < 0.4) {
    shift.location = pickRandom(LOCATION_HINTS)
  }

  // ~25% of shifts get a note.
  if (Math.random() < 0.25) {
    shift.notes = pickRandom(NOTE_BANK)
  }

  if (status === 'claimed') {
    shift.claimedByProfessionalId = pickRandom(professionals).id
    shift.claimedAt = randomClaimedAt(createdAt, date)
  }

  shifts.push(shift)
}

// Stable sort by date ASC then startTime ASC — easier to scan in the JSON file.
shifts.sort((a, b) => {
  if (a.date !== b.date) return a.date.localeCompare(b.date)
  return a.startTime.localeCompare(b.startTime)
})

// Re-issue stable IDs in sorted order (sh_001 .. sh_121) so consumers can predict.
shifts.forEach((s, i) => {
  s.id = `sh_${String(i + 1).padStart(3, '0')}`
})

// ── Write ────────────────────────────────────────────────────────────────────

await fs.writeFile(outputPath, JSON.stringify(shifts, null, 2) + '\n', 'utf8')

const summary = {
  total: shifts.length,
  byStatus: shifts.reduce((acc, s) => ((acc[s.status] = (acc[s.status] || 0) + 1), acc), {}),
  byRole: shifts.reduce((acc, s) => ((acc[s.role] = (acc[s.role] || 0) + 1), acc), {}),
  byShiftType: shifts.reduce(
    (acc, s) => ((acc[s.shiftType] = (acc[s.shiftType] || 0) + 1), acc),
    {},
  ),
  byUrgency: shifts.reduce((acc, s) => ((acc[s.urgency] = (acc[s.urgency] || 0) + 1), acc), {}),
  byPostedByStaff: shifts.reduce(
    (acc, s) => ((acc[s.postedByStaffId] = (acc[s.postedByStaffId] || 0) + 1), acc),
    {},
  ),
  withLocation: shifts.filter((s) => s.location).length,
  withCoords: shifts.filter((s) => s.lat != null && s.lng != null).length,
  withNotes: shifts.filter((s) => s.notes).length,
}

console.log(`✓ Wrote ${shifts.length} shifts to ${path.relative(process.cwd(), outputPath)}`)
console.log(JSON.stringify(summary, null, 2))
