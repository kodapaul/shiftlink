<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useShiftsStore } from '@/stores/shifts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import facilitiesData from '@/data/facilities.json'
import type { Facility } from '@/modules/facility/types'
import type { Shift } from '@/modules/shifts/types'
import { ShiftStatus } from '@/modules/shifts/enums'
import PostedShiftCard from '../components/PostedShiftCard.vue'
import { Plus, ClipboardList, Search, Sparkles, X } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'

const facilities = facilitiesData as Facility[]

const auth = useAuthStore()
const shifts = useShiftsStore()
const router = useRouter()

onMounted(() => {
  shifts.hydrateIfEmpty()
})

const facility = computed<Facility | null>(() =>
  auth.facilityId ? facilities.find((f) => f.id === auth.facilityId) ?? null : null,
)

// Single-facility model — every shift belongs to "the facility", so the
// dashboard shows them all.
const myShifts = computed<Shift[]>(() => shifts.sortedShifts)

const openShifts = computed(() => myShifts.value.filter((s) => s.status === ShiftStatus.Open))
const claimedShifts = computed(() =>
  myShifts.value.filter((s) => s.status === ShiftStatus.Claimed),
)

type FilterTab = 'all' | 'open' | 'claimed'
const activeFilter = ref<FilterTab>('open')

// Free text search across role, location, and notes.
const searchQuery = ref('')

// Apply the status tab first, then the search query.
const visibleShifts = computed(() => {
  let list: Shift[]
  if (activeFilter.value === 'open') list = openShifts.value
  else if (activeFilter.value === 'claimed') list = claimedShifts.value
  else list = myShifts.value

  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return list

  return list.filter((s) => {
    const haystack = [s.role, s.location ?? '', s.notes ?? ''].join(' ').toLowerCase()
    return haystack.includes(q)
  })
})

// Live count after both filters are applied. Used in the empty state copy.
const matchingCount = computed(() => visibleShifts.value.length)
const isSearching = computed(() => searchQuery.value.trim().length > 0)

// ── Delete dialog ────────────────────────────────────────────────────────────
const deleteTarget = ref<Shift | null>(null)
const deleteOpen = ref(false)

function askDelete(id: string) {
  deleteTarget.value = myShifts.value.find((s) => s.id === id) ?? null
  deleteOpen.value = true
}

function confirmDelete() {
  if (deleteTarget.value) shifts.remove(deleteTarget.value.id)
  deleteOpen.value = false
  deleteTarget.value = null
}

function postShift() {
  router.push('/facility/shifts/new')
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

const firstName = computed(() => auth.currentFacilityStaff?.name.split(' ')[0] ?? '')
</script>

<template>
  <div class="min-h-svh bg-cream">
    <!-- ── Page header ─────────────────────────────────────────────── -->
    <header class="px-6 pt-10 pb-8 md:px-12 md:pt-14 md:pb-10">
      <div class="mx-auto max-w-6xl">
        <p class="text-[11px] uppercase tracking-[0.22em] text-ink/45">
          {{ facility?.location ?? 'Facility dashboard' }}
        </p>

        <div class="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div class="max-w-3xl">
            <h1 class="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-ink md:text-[52px]">
              {{ greeting }}, {{ firstName }}.
            </h1>
            <p class="mt-3 max-w-prose text-base leading-relaxed text-ink/65 md:text-lg">
              {{ facility?.name }} —
              <span class="text-ink/85">{{ openShifts.length }}</span>
              {{ openShifts.length === 1 ? 'shift' : 'shifts' }}
              still open,
              <span class="text-ink/85">{{ claimedShifts.length }}</span>
              already claimed.
            </p>
          </div>

          <Button
            class="h-12 self-start rounded-full bg-marigold px-6 text-[15px] font-medium text-ink hover:bg-marigold/90 md:self-auto"
            @click="postShift"
          >
            <Plus class="h-4 w-4" />
            Post a shift
          </Button>
        </div>
      </div>
    </header>

    <!-- Filter tabs + search + list -->
    <section class="px-6 pb-16 md:px-12 md:pb-24">
      <div class="mx-auto max-w-6xl">
        <!-- Search row. Sits above the tabs so it filters whatever tab is active. -->
        <div class="relative mb-4">
          <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
          <Input
            v-model="searchQuery"
            type="search"
            placeholder="Search by role, location, or notes"
            class="h-12 rounded-xl border-mist bg-bone pl-11 pr-10 text-[15px]"
          />
          <button
            v-if="isSearching"
            type="button"
            aria-label="Clear search"
            class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-ink/45 transition-colors hover:bg-ink/5 hover:text-ink"
            @click="searchQuery = ''"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Status tabs -->
        <div class="flex flex-wrap items-center gap-2 border-b border-mist pb-4">
          <button
            v-for="tab in [
              { id: 'open', label: 'Open', count: openShifts.length },
              { id: 'claimed', label: 'Claimed', count: claimedShifts.length },
              { id: 'all', label: 'All shifts', count: myShifts.length },
            ]"
            :key="tab.id"
            type="button"
            :class="[
              'group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer',
              activeFilter === tab.id
                ? 'bg-ink text-cream'
                : 'text-ink/65 hover:bg-ink/5 hover:text-ink',
            ]"
            @click="activeFilter = tab.id as FilterTab"
          >
            <span>{{ tab.label }}</span>
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-[11px] tabular-nums',
                activeFilter === tab.id
                  ? 'bg-cream/15 text-cream'
                  : 'bg-ink/8 text-ink/60 group-hover:bg-ink/12',
              ]"
            >
              {{ tab.count }}
            </span>
          </button>

          <!-- Live "matching N" indicator when a search is active -->
          <span
            v-if="isSearching"
            class="ml-auto text-[12px] text-ink/55"
          >
            {{ matchingCount }} match{{ matchingCount === 1 ? '' : 'es' }}
          </span>
        </div>

        <!-- Empty state. Three flavours: no matches for search, no claimed, otherwise empty. -->
        <div
          v-if="visibleShifts.length === 0"
          class="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-mist bg-bone/60 px-6 py-20 text-center"
        >
          <div
            aria-hidden="true"
            class="flex h-14 w-14 items-center justify-center rounded-2xl bg-marigold/30"
          >
            <Sparkles class="h-6 w-6 text-ink/70" />
          </div>
          <h2 class="mt-6 font-serif text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            <template v-if="isSearching">No shifts match "{{ searchQuery }}".</template>
            <template v-else-if="activeFilter === 'open'">No open shifts right now.</template>
            <template v-else-if="activeFilter === 'claimed'">Nothing claimed yet.</template>
            <template v-else>You haven't posted any shifts.</template>
          </h2>
          <p class="mt-3 max-w-md text-sm leading-relaxed text-ink/60">
            <template v-if="isSearching">
              Try a different role, location, or wording.
            </template>
            <template v-else-if="activeFilter === 'claimed'">
              Once a professional picks up one of your open shifts, it'll show up here.
            </template>
            <template v-else>
              Post a shift to start. We'll surface it to qualified professionals nearby.
            </template>
          </p>
          <Button
            v-if="isSearching"
            variant="outline"
            class="mt-6 h-11 rounded-full border-ink/20 px-5 text-sm font-medium hover:bg-ink/5"
            @click="searchQuery = ''"
          >
            Clear search
          </Button>
          <Button
            v-else-if="activeFilter !== 'claimed'"
            class="mt-6 h-11 rounded-full bg-ink px-5 text-sm font-medium text-cream hover:bg-ink/90"
            @click="postShift"
          >
            <Plus class="h-4 w-4" />
            Post a shift
          </Button>
        </div>

        <!-- ── List ──────────────────────────────────────────────── -->
        <div v-else class="mt-8 space-y-4">
          <PostedShiftCard
            v-for="shift in visibleShifts"
            :key="shift.id"
            :shift="shift"
            @delete="askDelete"
          />
        </div>
      </div>
    </section>

    <!-- ── Delete confirmation dialog ─────────────────────────────── -->
    <Dialog v-model:open="deleteOpen">
      <DialogContent class="border-mist bg-bone sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="font-serif text-2xl font-semibold leading-tight tracking-tight">
            Delete this shift?
          </DialogTitle>
          <DialogDescription class="text-ink/65">
            Professionals who haven't claimed it yet will no longer see this posting. This can't be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div
          v-if="deleteTarget"
          class="my-2 flex items-center gap-3 rounded-2xl border border-mist bg-cream/60 px-4 py-3 text-sm"
        >
          <ClipboardList class="h-4 w-4 shrink-0 text-ink/55" />
          <p class="truncate text-ink/85">
            {{ deleteTarget.role.replace(/_/g, ' ') }} · {{ deleteTarget.date }} ·
            {{ deleteTarget.startTime }}–{{ deleteTarget.endTime }}
          </p>
        </div>

        <DialogFooter class="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            class="text-ink/70 hover:bg-ink/5 hover:text-ink"
            @click="deleteOpen = false"
          >
            Cancel
          </Button>
          <Button
            class="bg-ink text-cream hover:bg-ink/90"
            @click="confirmDelete"
          >
            Delete shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
