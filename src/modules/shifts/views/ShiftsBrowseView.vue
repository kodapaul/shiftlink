<script setup lang="ts">
/**
 * Shifts browse + apply (`/shifts`).
 *
 * Professional-side experience for finding and applying to open shifts.
 * Renders inside `PublicLayout`, so the wordmark + nav + sign-out live in
 * `PublicHeader`. This view owns:
 *   - Heading + intro
 *   - Filter row (search, shift-type pills, urgent toggle)
 *   - Split layout: scrollable list of `ShiftBrowseRow`s (left) + sticky
 *     `ShiftMap` (right) on lg+. Mobile collapses to a single column with
 *     a "Show map" toggle button.
 *   - `ShiftApplyDialog` opened by clicking a row or pin.
 *
 * State + actions live in `useShiftsBrowse`. The parent only owns
 * presentation, dialog open state, and the show-map toggle.
 */

import { computed, onBeforeMount, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useShiftsStore } from '@/stores/shifts'
import { useApplicationsStore } from '@/stores/applications'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import DatePicker from '@/components/DatePicker.vue'
import ShiftMap from '@/components/ShiftMap.vue'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import facilitiesData from '@/data/facilities.json'
import type { Facility } from '@/modules/facility/types'
import {
  CalendarSearch,
  Flame,
  List as ListIcon,
  Map as MapIcon,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-vue-next'
import { ShiftType, SHIFT_TYPE_LABELS } from '@/modules/shifts/enums'
import { useShiftsBrowse } from '@/modules/shifts/composables/useShiftsBrowse'
import ShiftBrowseRow from '@/modules/shifts/components/ShiftBrowseRow.vue'
import ShiftApplyDialog from '@/modules/shifts/components/ShiftApplyDialog.vue'

const auth = useAuthStore()
const shiftsStore = useShiftsStore()
const applicationsStore = useApplicationsStore()

onBeforeMount(() => {
  shiftsStore.hydrateIfEmpty()
  applicationsStore.hydrateIfEmpty()
})

const {
  filters,
  toggleShiftType,
  clearFilters,
  filteredShifts,
  applicationFor,
  selectedId,
  selectedShift,
  selectShift,
  completeness,
  applyToShift,
  cancelApplication,
} = useShiftsBrowse()

// The single demo facility — every shift implicitly belongs to it. Pulled
// once and printed on every browse row so the brief's "facility name on
// each card" requirement is met explicitly. Single-facility model means
// we don't need a per-shift facilityId lookup.
const facility = (facilitiesData as Facility[])[0]
const facilityName = facility?.name ?? null

// Mobile view toggle. lg+ always shows both list and map side-by-side;
// mobile shows ONE at a time (toggled via a segmented control in the
// filter bar) so the user gets the full vertical real estate for whichever
// view they're using.
type MobileView = 'list' | 'map'
const mobileView = ref<MobileView>('list')

// Filters drawer state — keeps the toolbar clean. Search stays inline
// (used most often), every other filter lives behind a button that opens
// this side sheet.
const filtersOpen = ref<boolean>(false)

// Apply dialog state.
const dialogOpen = ref<boolean>(false)
const submitting = ref<boolean>(false)
const dialogError = ref<string | null>(null)

const shiftTypeOptions = Object.values(ShiftType)

const selectedApplication = computed(() =>
  selectedShift.value ? applicationFor(selectedShift.value.id) : null,
)

const hasActiveFilters = computed<boolean>(
  () =>
    filters.searchQuery.trim().length > 0 ||
    filters.shiftTypes.size > 0 ||
    filters.urgentOnly ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '',
)

/** Count of non-search active filters — rendered as a badge next to the
 *  Filters button so the user sees at a glance how many constraints are
 *  applied without opening the drawer. Search is excluded because it has
 *  its own inline UI. */
const activeFilterCount = computed<number>(() => {
  let n = 0
  n += filters.shiftTypes.size
  if (filters.urgentOnly) n += 1
  if (filters.dateFrom) n += 1
  if (filters.dateTo) n += 1
  return n
})

const resultsLabel = computed<string>(() => {
  const n = filteredShifts.value.length
  if (n === 0) return 'No matching shifts'
  if (n === 1) return '1 shift'
  return `${n} shifts`
})

function openApplyDialog(shiftId: string): void {
  selectShift(shiftId)
  dialogError.value = null
  dialogOpen.value = true
}

function onSelectFromMap(shiftId: string): void {
  // Pin click: highlight the row but don't open the dialog automatically —
  // the map context might be more useful first.
  selectShift(shiftId)
}

function handleSubmit(message: string): void {
  if (!selectedShift.value) return
  submitting.value = true
  const result = applyToShift(selectedShift.value.id, message)
  submitting.value = false

  if (result.ok) {
    dialogOpen.value = false
    return
  }

  // Banners inside the dialog handle profile-incomplete and already-applied
  // already; the no-session branch falls through to a quiet alert. (Realistic
  // — the route guard prevents unauth visitors anyway.)
  if (result.reason === 'no-session') {
    dialogError.value = 'Sign in as a professional to apply.'
  }
}

function handleCancelApplication(applicationId: string): void {
  if (cancelApplication(applicationId)) {
    dialogOpen.value = false
  }
}
</script>

<template>
  <main class="px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
    <div class="mx-auto max-w-screen-2xl space-y-10">
      <!-- Heading -->
      <header class="space-y-3">
        <p class="text-[11px] uppercase tracking-[0.22em] text-ink/55">
          Shift search
        </p>
        <h1
          class="font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl"
        >
          Open shifts across Sydney.
        </h1>
        <p class="max-w-2xl text-[15px] leading-relaxed text-ink/65">
          Browse what's open right now. Click a shift to see the details
          and apply in one tap. The facility decides; accepted shifts land
          on your dashboard.
        </p>
      </header>

      <!-- Filter bar — search stays inline (used most often). Everything
           else lives behind the Filters button, which opens a side sheet
           with all the controls grouped. Keeps the toolbar clean across
           every viewport. -->
      <section class="space-y-3">
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <div class="relative min-w-[200px] flex-1">
            <Search
              class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45"
            />
            <Input
              v-model="filters.searchQuery"
              type="search"
              placeholder="Search by role, location, or note"
              class="h-12 rounded-xl border-mist bg-bone pl-11 pr-10 text-[15px]"
            />
            <button
              v-if="filters.searchQuery"
              type="button"
              aria-label="Clear search"
              class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-ink/45 transition-colors hover:bg-ink/5 hover:text-ink"
              @click="filters.searchQuery = ''"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            class="h-12 flex-shrink-0 rounded-xl border-mist bg-bone px-4 text-[14px] font-medium text-ink hover:bg-mist/60"
            @click="filtersOpen = true"
          >
            <SlidersHorizontal class="h-4 w-4" />
            <span>Filters</span>
            <span
              v-if="activeFilterCount > 0"
              class="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-medium tabular-nums text-cream"
            >
              {{ activeFilterCount }}
            </span>
          </Button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            v-if="hasActiveFilters"
            type="button"
            class="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full px-3 text-[12px] text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink"
            @click="clearFilters"
          >
            Clear all filters
          </button>

          <span class="ml-auto text-[12px] text-ink/55 tabular-nums">
            {{ resultsLabel }}
          </span>

          <!-- Mobile-only List/Map segmented toggle. lg+ shows both panels
               side-by-side, so this control hides via lg:hidden. Plain
               <button>s (not shadcn Button) to avoid bg-primary bleed. -->
          <div
            role="tablist"
            aria-label="Shift list view"
            class="inline-flex items-center gap-1 rounded-full bg-mist/60 p-1 lg:hidden"
          >
            <button
              type="button"
              role="tab"
              :aria-selected="mobileView === 'list'"
              :class="[
                'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors',
                mobileView === 'list'
                  ? 'bg-ink text-cream'
                  : 'bg-transparent text-ink/65 hover:bg-ink/5 hover:text-ink',
              ]"
              @click="mobileView = 'list'"
            >
              <ListIcon class="h-3 w-3" />
              List
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="mobileView === 'map'"
              :class="[
                'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors',
                mobileView === 'map'
                  ? 'bg-ink text-cream'
                  : 'bg-transparent text-ink/65 hover:bg-ink/5 hover:text-ink',
              ]"
              @click="mobileView = 'map'"
            >
              <MapIcon class="h-3 w-3" />
              Map
            </button>
          </div>
        </div>
      </section>

      <!-- Split layout: list (left) + map (right) at lg+. On mobile, the
           List/Map toggle above swaps which one is visible — both panels
           keep `lg:block` so they always show together at lg+. -->
      <section class="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <!-- LIST -->
        <div
          :class="[
            mobileView === 'list' ? 'block' : 'hidden',
            'space-y-3 lg:block',
          ]"
        >
          <div
            v-if="filteredShifts.length === 0"
            class="rounded-3xl border border-dashed border-mist bg-bone/60 px-6 py-16 text-center"
          >
            <div
              class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mist/70"
            >
              <CalendarSearch class="h-5 w-5 text-ink/55" />
            </div>
            <h2 class="mt-5 font-serif text-xl font-semibold tracking-tight text-ink">
              <template v-if="hasActiveFilters">
                Nothing matches those filters.
              </template>
              <template v-else>No open shifts right now.</template>
            </h2>
            <p class="mx-auto mt-2 max-w-md text-sm text-ink/55">
              <template v-if="hasActiveFilters">
                Loosen a filter or clear them all to see what's available.
              </template>
              <template v-else>
                Check back soon — facilities post throughout the day.
              </template>
            </p>
            <Button
              v-if="hasActiveFilters"
              variant="outline"
              class="mt-5 h-10 rounded-full border-ink/20 px-4 text-sm hover:bg-ink/5"
              @click="clearFilters"
            >
              Clear filters
            </Button>
          </div>

          <ShiftBrowseRow
            v-for="shift in filteredShifts"
            :key="shift.id"
            :shift="shift"
            :facility-name="facilityName"
            :application="applicationFor(shift.id)"
            :selected="selectedId === shift.id"
            @select="selectShift"
            @apply="openApplyDialog"
          />
        </div>

        <!-- MAP -->
        <!-- `isolate` (= isolation: isolate) keeps Leaflet's internal
             z-indices (markers, popups, controls) scoped to this wrapper
             so they never bleed through overlays (PublicHeader, future
             modals). On mobile the map gets a generous height since it's
             the only visible panel; on lg+ it sticks to the viewport. -->
        <div
          :class="[
            mobileView === 'map' ? 'block' : 'hidden',
            'isolate lg:sticky lg:top-24 lg:block lg:h-[calc(100dvh-8rem)]',
          ]"
        >
          <ShiftMap
            :shifts="filteredShifts"
            :selected-id="selectedId"
            class="h-[70vh] min-h-[420px] w-full lg:h-full lg:min-h-0"
            @select="onSelectFromMap"
          />
        </div>
      </section>

      <!-- Quiet error if a no-session edge case slips past the guard -->
      <p
        v-if="dialogError"
        class="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive"
      >
        {{ dialogError }}
      </p>
    </div>

    <ShiftApplyDialog
      v-model:open="dialogOpen"
      :shift="selectedShift"
      :user-type="auth.userType"
      :application="selectedApplication"
      :completeness="completeness"
      :submitting="submitting"
      @submit="handleSubmit"
      @cancel="handleCancelApplication"
    />

    <!-- Filters drawer — slides in from the right on every viewport.
         Holds shift type pills, urgency toggle, and date range pickers.
         All controls bind directly to the same filter state the inline
         search does, so changes apply live; the Done button just closes
         the sheet. -->
    <Sheet v-model:open="filtersOpen">
      <SheetContent
        side="right"
        class="w-[88vw] max-w-md border-l border-mist bg-cream p-0"
      >
        <SheetHeader class="border-b border-mist px-6 py-5">
          <SheetTitle
            class="text-left font-serif text-xl font-semibold tracking-tight text-ink"
          >
            Filters
          </SheetTitle>
          <SheetDescription class="text-left text-[13px] text-ink/60">
            Narrow the shift list. Changes apply as you go.
          </SheetDescription>
        </SheetHeader>

        <div class="flex h-[calc(100%-9rem)] flex-col gap-7 overflow-y-auto px-6 py-6">
          <!-- Shift type -->
          <div class="space-y-3">
            <p class="text-[11px] font-medium uppercase tracking-[0.18em] text-ink/55">
              Shift type
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="t in shiftTypeOptions"
                :key="t"
                type="button"
                :aria-pressed="filters.shiftTypes.has(t)"
                :class="[
                  'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-medium transition-colors',
                  filters.shiftTypes.has(t)
                    ? 'border-ink bg-ink text-cream'
                    : 'border-mist bg-bone text-ink/65 hover:border-ink/30 hover:text-ink',
                ]"
                @click="toggleShiftType(t)"
              >
                {{ SHIFT_TYPE_LABELS[t] }}
              </button>
            </div>
          </div>

          <!-- Urgency -->
          <div class="space-y-3">
            <p class="text-[11px] font-medium uppercase tracking-[0.18em] text-ink/55">
              Urgency
            </p>
            <button
              type="button"
              :aria-pressed="filters.urgentOnly"
              :class="[
                'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-medium transition-colors',
                filters.urgentOnly
                  ? 'border-blush bg-blush text-ink'
                  : 'border-mist bg-bone text-ink/65 hover:border-blush/60 hover:text-ink',
              ]"
              @click="filters.urgentOnly = !filters.urgentOnly"
            >
              <Flame class="h-3 w-3" />
              Urgent shifts only
            </button>
          </div>

          <!-- Date range -->
          <div class="space-y-3">
            <p class="text-[11px] font-medium uppercase tracking-[0.18em] text-ink/55">
              Date range
            </p>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-1.5">
                <label class="text-[12px] font-medium text-ink/70">From</label>
                <DatePicker
                  v-model="filters.dateFrom"
                  placeholder="Any"
                  :max-date="filters.dateTo || undefined"
                  class="h-11 w-full rounded-xl border-mist bg-bone text-[13px] font-medium text-ink/75"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-[12px] font-medium text-ink/70">To</label>
                <DatePicker
                  v-model="filters.dateTo"
                  placeholder="Any"
                  :min-date="filters.dateFrom || undefined"
                  class="h-11 w-full rounded-xl border-mist bg-bone text-[13px] font-medium text-ink/75"
                />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter class="border-t border-mist bg-bone/50 px-6 py-4">
          <div class="flex w-full items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              class="h-10 rounded-full px-4 text-[13px] text-ink/65 hover:bg-ink/5 hover:text-ink"
              :disabled="activeFilterCount === 0"
              @click="clearFilters"
            >
              Clear all
            </Button>
            <Button
              type="button"
              class="h-10 rounded-full bg-ink px-5 text-[13px] font-medium text-cream hover:bg-ink/90"
              @click="filtersOpen = false"
            >
              Show {{ filteredShifts.length }} {{ filteredShifts.length === 1 ? 'shift' : 'shifts' }}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  </main>
</template>
