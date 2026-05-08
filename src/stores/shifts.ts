/**
 * Shifts store — source of truth for all shifts in the prototype.
 *
 * Hydrates from `src/data/shifts.json` on first load (when the persisted state
 * is empty). After that, it's a Pinia-managed array persisted to localStorage,
 * so creates / deletes / claim updates all survive reload.
 *
 * Both the professional shift board and the facility dashboard read from this
 * single store — there is no separate "facility shifts" data source.
 */

import { defineStore } from 'pinia'
import { computed, ref, type Ref } from 'vue'
import shiftsSeed from '@/data/shifts.json'
import { ShiftStatus } from '@/modules/shifts/enums'
import type { Shift } from '@/modules/shifts/types'

const seedShifts = shiftsSeed as Shift[]

export const useShiftsStore = defineStore(
  'shifts',
  () => {
    const shifts: Ref<Shift[]> = ref([])

    /** Hydrate from the seed data if the store is currently empty. */
    function hydrateIfEmpty(): void {
      if (shifts.value.length === 0) {
        shifts.value = seedShifts.slice() as Shift[]
      }
      sanitizeRoles()
    }

    /**
     * One-time data migration — older versions of the seed data used
     * snake_case role values like 'assistant_in_nursing'. The current model
     * treats `Shift.role` as free text, so any persisted value with that
     * shape gets cleaned up (Title Case, spaces). Runs on every hydrate but
     * is idempotent — once data is clean, this is a no-op.
     */
    function sanitizeRoles(): void {
      const SNAKE = /^[a-z]+(_[a-z]+)+$/
      let mutated = false
      const next = shifts.value.map((s) => {
        if (!SNAKE.test(s.role)) return s
        mutated = true
        return {
          ...s,
          role: s.role
            .split('_')
            .map((w) => w[0]!.toUpperCase() + w.slice(1))
            .join(' '),
        }
      })
      if (mutated) shifts.value = next
    }

    /** Reset to the seed data (useful for "reset demo" actions). */
    function resetToSeed(): void {
      shifts.value = seedShifts.slice() as Shift[]
    }

    function getById(id: string): Shift | undefined {
      return shifts.value.find((s) => s.id === id)
    }

    /** Compose a new shift id. Format: `sh_NNN` where NNN auto-increments. */
    function nextId(): string {
      let n = 1
      const existing = new Set(shifts.value.map((s) => s.id))
      while (existing.has(`sh_${String(n).padStart(3, '0')}`)) n++
      return `sh_${String(n).padStart(3, '0')}`
    }

    /** Create a new shift. Caller passes the form-derived data; we add id + createdAt + status. */
    function create(input: Omit<Shift, 'id' | 'createdAt' | 'status'>): Shift {
      const shift: Shift = {
        ...input,
        id: nextId(),
        status: ShiftStatus.Open,
        createdAt: new Date().toISOString(),
      }
      shifts.value.unshift(shift)
      return shift
    }

    function remove(id: string) {
      shifts.value = shifts.value.filter((s) => s.id !== id)
    }

    /**
     * Update an existing shift in-place. The caller passes a partial — id and
     * createdAt cannot be changed (they identify the record). Returns the
     * updated shift, or null if the id was not found.
     */
    function update(
      id: string,
      partial: Partial<Omit<Shift, 'id' | 'createdAt'>>,
    ): Shift | null {
      const idx = shifts.value.findIndex((s) => s.id === id)
      if (idx === -1) return null
      const next = { ...shifts.value[idx], ...partial } as Shift
      shifts.value.splice(idx, 1, next)
      return next
    }

    /** All shifts, sorted by date ASC then startTime ASC. */
    const sortedShifts = computed<Shift[]>(() =>
      [...shifts.value].sort(
        (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
      ),
    )

    /** Open shifts only (for the professional board). Sorted by date ASC. */
    const openShifts = computed<Shift[]>(() =>
      shifts.value
        .filter((s) => s.status === ShiftStatus.Open)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    )

    return {
      shifts,
      sortedShifts,
      openShifts,
      hydrateIfEmpty,
      resetToSeed,
      getById,
      create,
      update,
      remove,
    }
  },
  /* pinia-plugin-persistedstate's `persist` augmentation can't narrow this
   * setup store's picked state under pinia@3 + Vue 3.5 + plugin@4.7 (actions
   * returning `Shift`/`Shift[]` leak into the StateTree extraction). Runtime
   * works fine — the cast is just to satisfy the type checker. */
  { persist: true } as Record<string, unknown>,
)
