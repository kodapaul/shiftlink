<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useShiftsStore } from '@/stores/shifts'
import ShiftMap from '@/components/ShiftMap.vue'
import { ShiftStatus, Urgency } from '@/modules/shifts/enums'
import type { Shift } from '@/modules/shifts/types'
import {
  formatRate,
  formatRelativeDate,
  formatShiftDate,
  formatShiftTimes,
} from '@/helpers/format'
import { MapPin } from 'lucide-vue-next'

const shifts = useShiftsStore()

onMounted(() => {
  shifts.hydrateIfEmpty()
})

type Filter = 'open' | 'all'
const filter = ref<Filter>('open')

const visibleShifts = computed<Shift[]>(() => {
  const base =
    filter.value === 'open' ? shifts.openShifts : shifts.sortedShifts
  // Only shifts with coordinates can be pinned + flown to.
  return base.filter((s) => s.lat != null && s.lng != null)
})

const pinnedCount = computed(() => visibleShifts.value.length)
const openCount = computed(() => shifts.openShifts.length)
const totalCount = computed(() => shifts.shifts.length)

// ── Selection (list ↔ map two-way) ───────────────────────────────────────────
const selectedId = ref<string | null>(null)

function selectShift(id: string) {
  selectedId.value = id
  // Scroll the picked row into view if the user clicked it via the map pin.
  nextTick(() => {
    const el = document.querySelector(`[data-shift-id="${id}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

// If the filter changes such that the selected shift is no longer visible,
// clear the selection so the map stops trying to fly to a hidden pin.
watch(visibleShifts, (next) => {
  if (selectedId.value && !next.some((s) => s.id === selectedId.value)) {
    selectedId.value = null
  }
})

// ── Status pill helpers (inlined — small enough not to need a component) ────
function statusClasses(shift: Shift): string {
  if (shift.status === ShiftStatus.Claimed)
    return 'bg-mist text-ink/65 border border-mist'
  if (shift.urgency === Urgency.Urgent) return 'bg-blush/55 text-ink border border-blush'
  return 'bg-sage/45 text-ink border border-sage/70'
}

function statusLabel(shift: Shift): string {
  if (shift.status === ShiftStatus.Claimed) return 'Claimed'
  if (shift.urgency === Urgency.Urgent) return 'Urgent'
  return 'Open'
}
</script>

<template>
  <div class="flex min-h-svh flex-col bg-cream">
    <!-- ── Header ──────────────────────────────────────────────────── -->
    <header class="px-6 pt-10 pb-6 md:px-12 md:pt-14 md:pb-6">
      <div class="mx-auto max-w-7xl">
        <p class="text-[11px] uppercase tracking-[0.22em] text-ink/45">Shift map</p>
        <div class="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1
              class="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-ink md:text-[52px]"
            >
              Where the work is.
            </h1>
            <p class="mt-3 max-w-prose text-base leading-relaxed text-ink/65 md:text-lg">
              {{ pinnedCount }} {{ pinnedCount === 1 ? 'shift' : 'shifts' }} pinned across Sydney
              ·
              <button
                type="button"
                :class="[
                  'cursor-pointer rounded-full px-2 py-0.5 text-sm transition-colors',
                  filter === 'open' ? 'bg-ink text-cream' : 'text-ink/65 hover:text-ink',
                ]"
                @click="filter = 'open'"
              >
                Open ({{ openCount }})
              </button>
              <button
                type="button"
                :class="[
                  'ml-1 cursor-pointer rounded-full px-2 py-0.5 text-sm transition-colors',
                  filter === 'all' ? 'bg-ink text-cream' : 'text-ink/65 hover:text-ink',
                ]"
                @click="filter = 'all'"
              >
                All ({{ totalCount }})
              </button>
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- ── Split view: list left, map right ─────────────────────────── -->
    <section class="flex-1 px-6 pb-12 md:px-12">
      <div
        class="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[380px_1fr] lg:gap-6"
        style="height: 70vh; min-height: 520px"
      >
        <!-- ── List ─────────────────────────────────────────────────── -->
        <aside
          class="flex h-full flex-col overflow-hidden rounded-2xl border border-mist bg-bone"
        >
          <header class="border-b border-mist px-5 pt-4 pb-3">
            <p class="text-[10px] uppercase tracking-[0.22em] text-ink/45">
              {{ filter === 'open' ? 'Open shifts' : 'All shifts' }}
            </p>
            <p class="mt-1 font-serif text-lg font-semibold text-ink">
              {{ pinnedCount }} on the map
            </p>
          </header>

          <ul
            v-if="visibleShifts.length"
            class="flex-1 overflow-y-auto"
          >
            <li
              v-for="shift in visibleShifts"
              :key="shift.id"
              :data-shift-id="shift.id"
              :class="[
                'group cursor-pointer border-b border-mist/70 px-5 py-4 transition-colors last:border-b-0',
                selectedId === shift.id
                  ? 'bg-marigold/20'
                  : 'hover:bg-cream/55',
              ]"
              @click="selectShift(shift.id)"
            >
              <div class="flex items-start justify-between gap-3">
                <span
                  :class="[
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]',
                    statusClasses(shift),
                  ]"
                >
                  {{ statusLabel(shift) }}
                </span>
                <span class="text-[11px] tabular-nums text-ink/50">
                  {{ formatShiftDate(shift.date) }}
                </span>
              </div>

              <h3
                class="mt-2 font-serif text-[17px] font-semibold leading-tight tracking-tight text-ink"
              >
                {{ shift.role }}
              </h3>

              <p class="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[12px] text-ink/65">
                <span>{{ formatRelativeDate(shift.date) }}</span>
                <span class="text-ink/30">·</span>
                <span class="tabular-nums">{{ formatShiftTimes(shift.startTime, shift.endTime) }}</span>
                <span class="text-ink/30">·</span>
                <span class="font-medium text-ink/85">{{ formatRate(shift.hourlyRate) }}</span>
              </p>

              <p
                v-if="shift.location"
                class="mt-1.5 inline-flex items-center gap-1 text-[12px] text-ink/55"
              >
                <MapPin class="h-3 w-3" />
                {{ shift.location }}
              </p>
            </li>
          </ul>

          <div
            v-else
            class="flex flex-1 items-center justify-center px-6 text-center text-sm text-ink/55"
          >
            No shifts to show.
          </div>
        </aside>

        <!-- ── Map ──────────────────────────────────────────────────── -->
        <div class="h-full min-h-[60vh] lg:min-h-0">
          <ShiftMap
            :shifts="visibleShifts"
            :selected-id="selectedId"
            @select="selectShift"
          />
        </div>
      </div>

      <!-- ── Legend ───────────────────────────────────────────────────── -->
      <div class="mx-auto mt-6 flex max-w-7xl flex-wrap items-center gap-6 text-[12px] text-ink/65">
        <span class="inline-flex items-center gap-2">
          <span
            class="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-bone bg-sage shadow-sm"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-forest" />
          </span>
          Open
        </span>
        <span class="inline-flex items-center gap-2">
          <span
            class="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-bone bg-blush shadow-sm"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-ink" />
          </span>
          Urgent · Open
        </span>
        <span class="inline-flex items-center gap-2">
          <span
            class="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-bone bg-mist shadow-sm"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-ink/60" />
          </span>
          Claimed
        </span>
      </div>
    </section>
  </div>
</template>
