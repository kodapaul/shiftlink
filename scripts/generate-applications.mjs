#!/usr/bin/env node
/**
 * Generate src/data/applications.json
 *
 * Reads existing seed data so foreign keys are valid:
 *   shiftId         -> from src/data/shifts.json
 *   professionalId  -> from src/data/professionals.json
 *   decidedByStaffId -> from src/data/facilityStaff.json (when accepted/declined)
 *
 * Distribution targets:
 *   open shifts    -> 0 to 4 pending applications, weighted to 1-2
 *   claimed shifts -> exactly 1 accepted (the shift's claimedByProfessionalId)
 *                     plus 0-3 declined applications from other pros
 *
 * Run with: npm run data:applications
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '..', 'src', 'data')
const outputPath = path.join(dataDir, 'applications.json')

const shifts = JSON.parse(await fs.readFile(path.join(dataDir, 'shifts.json'), 'utf8'))
const staff = JSON.parse(await fs.readFile(path.join(dataDir, 'facilityStaff.json'), 'utf8'))
const professionals = JSON.parse(
  await fs.readFile(path.join(dataDir, 'professionals.json'), 'utf8'),
)

if (!professionals.length) {
  console.error('[generate-applications] No professionals in professionals.json')
  process.exit(1)
}
if (!staff.length) {
  console.error('[generate-applications] No facility staff in facilityStaff.json')
  process.exit(1)
}

// Helpers.
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// Weighted random pick for objects shaped { weight, value }.
function weighted(items) {
  const total = items.reduce((s, it) => s + it.weight, 0)
  let r = Math.random() * total
  for (const it of items) {
    r -= it.weight
    if (r <= 0) return it.value
  }
  return items[0].value
}

// Number of pending applications on an open shift. Skewed toward "lots of
// interest" so the dashboard demos look populated.
const OPEN_APPLICATION_COUNTS = [
  { weight: 5, value: 0 },
  { weight: 15, value: 1 },
  { weight: 25, value: 2 },
  { weight: 25, value: 3 },
  { weight: 20, value: 4 },
  { weight: 10, value: 5 },
]

// Claimed shifts get exactly one accepted applicant in the seed. Declined
// records from competing applicants only get created when a real accept
// happens at runtime via useApplicationsStore.accept(), keeping the seed
// clean: claimed = 1 applicant.

// A small bank of plausible cover notes.
const MESSAGE_BANK = [
  'Available and have palliative care experience.',
  'Familiar with the unit, happy to start early.',
  'Confirmed available for the full shift.',
  'Worked similar shifts here last month.',
  'AHPRA current, immunisations up to date.',
  'Can stay back if handover runs late.',
  'Mental Health First Aid certified.',
  'Regular night shift worker.',
  'Public transport-friendly availability.',
  'Available this whole week if more come up.',
]

// Pick N distinct professionals at random, optionally excluding a list of ids.
function pickProfessionals(n, excludeIds = []) {
  const pool = professionals.filter((p) => !excludeIds.includes(p.id))
  const out = []
  while (out.length < n && pool.length) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}

// Random ISO timestamp between two ISO timestamps.
function randomIsoBetween(startIso, endIso) {
  const a = new Date(startIso).getTime()
  const b = new Date(endIso).getTime()
  if (b <= a) return startIso
  return new Date(a + Math.floor(Math.random() * (b - a))).toISOString()
}

// Generate.
const applications = []
let counter = 1
const nextId = () => `app_${String(counter++).padStart(3, '0')}`

for (const shift of shifts) {
  // The boundary used for appliedAt and decidedAt is the shift date itself.
  const shiftEndIso = `${shift.date}T00:00:00.000Z`
  const createdAtIso = shift.createdAt

  if (shift.status === 'open') {
    const count = weighted(OPEN_APPLICATION_COUNTS)
    if (count === 0) continue

    const pros = pickProfessionals(count)
    for (const pro of pros) {
      const appliedAt = randomIsoBetween(createdAtIso, shiftEndIso)
      const app = {
        id: nextId(),
        shiftId: shift.id,
        professionalId: pro.id,
        status: 'pending',
        appliedAt,
      }
      // ~25% have a message.
      if (Math.random() < 0.25) app.message = pickRandom(MESSAGE_BANK)
      applications.push(app)
    }
    continue
  }

  // shift.status === 'claimed'
  const acceptedProId = shift.claimedByProfessionalId
  if (!acceptedProId) continue

  const claimedAtIso = shift.claimedAt ?? shiftEndIso
  const decidingStaffId = shift.postedByStaffId ?? pickRandom(staff).id

  // 1 accepted application.
  const acceptedAppliedAt = randomIsoBetween(createdAtIso, claimedAtIso)
  const accepted = {
    id: nextId(),
    shiftId: shift.id,
    professionalId: acceptedProId,
    status: 'accepted',
    appliedAt: acceptedAppliedAt,
    decidedAt: claimedAtIso,
    decidedByStaffId: decidingStaffId,
  }
  if (Math.random() < 0.3) accepted.message = pickRandom(MESSAGE_BANK)
  applications.push(accepted)
}

// Stable sort by appliedAt ASC for readability in the JSON file,
// then re-issue stable IDs in that order.
applications.sort((a, b) => a.appliedAt.localeCompare(b.appliedAt))
applications.forEach((a, i) => {
  a.id = `app_${String(i + 1).padStart(3, '0')}`
})

await fs.writeFile(outputPath, JSON.stringify(applications, null, 2) + '\n', 'utf8')

const summary = {
  total: applications.length,
  byStatus: applications.reduce(
    (acc, a) => ((acc[a.status] = (acc[a.status] || 0) + 1), acc),
    {},
  ),
  withMessage: applications.filter((a) => a.message).length,
  shiftsWithApplications: new Set(applications.map((a) => a.shiftId)).size,
  openShiftsTotal: shifts.filter((s) => s.status === 'open').length,
  claimedShiftsTotal: shifts.filter((s) => s.status === 'claimed').length,
}

console.log(`Wrote ${applications.length} applications to ${path.relative(process.cwd(), outputPath)}`)
console.log(JSON.stringify(summary, null, 2))
