<script setup lang="ts">
import { onMounted } from 'vue'
import { useApplicationsStore } from '@/stores/applications'
import { useShiftsStore } from '@/stores/shifts'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useFacilityApplications, type ApplicationsFilter } from '@/modules/applications/composables/useFacilityApplications'
import ApplicantRow from '@/modules/applications/components/ApplicantRow.vue'
import { Search, Inbox, X } from 'lucide-vue-next'

// Cross-shift triage view. Lists every application in the store, grouped by
// status tab (pending by default), with a search box that matches name /
// shift role / location / message. Accept / decline call straight through
// to the store via the composable; the store handles cross-store side
// effects (flipping the linked shift to claimed, etc.).

const applicationsStore = useApplicationsStore()
const shiftsStore = useShiftsStore()

// Hydrate on mount in case this is a deep-link visit.
onMounted(() => {
  applicationsStore.hydrateIfEmpty()
  shiftsStore.hydrateIfEmpty()
})

const {
  filter,
  searchQuery,
  rows,
  pendingCount,
  acceptedCount,
  declinedCount,
  totalCount,
  accept,
  decline,
} = useFacilityApplications()

// Tab list with counts; ids match the ApplicationsFilter union.
const tabs: ReadonlyArray<{ id: ApplicationsFilter; label: string }> = [
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'declined', label: 'Declined' },
  { id: 'all', label: 'All' },
]

function countFor(id: ApplicationsFilter): number {
  switch (id) {
    case 'pending':
      return pendingCount.value
    case 'accepted':
      return acceptedCount.value
    case 'declined':
      return declinedCount.value
    case 'all':
      return totalCount.value
  }
}
</script>

<template>
  <div class="min-h-svh bg-cream">
    <header class="px-6 pt-10 pb-6 md:px-12 md:pt-14 md:pb-8">
      <div class="mx-auto max-w-5xl">
        <p class="text-[11px] uppercase tracking-[0.22em] text-ink/45">Applications</p>

        <div class="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1
              class="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-ink md:text-[52px]"
            >
              Applications.
            </h1>
            <p class="mt-3 max-w-prose text-base leading-relaxed text-ink/65 md:text-lg">
              <span class="text-ink/85">{{ pendingCount }}</span>
              still waiting on your call. Triage by status, search by name or role.
            </p>
          </div>
        </div>
      </div>
    </header>

    <section class="px-6 pb-24 md:px-12">
      <div class="mx-auto max-w-5xl">
        <!-- Search row -->
        <div class="relative mb-4">
          <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
          <Input
            v-model="searchQuery"
            type="search"
            placeholder="Search by professional, role, or message"
            class="h-12 rounded-xl border-mist bg-bone pl-11 pr-10 text-[15px]"
          />
          <button
            v-if="searchQuery"
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
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            :class="[
              'group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer',
              filter === tab.id
                ? 'bg-ink text-cream'
                : 'text-ink/65 hover:bg-ink/5 hover:text-ink',
            ]"
            @click="filter = tab.id"
          >
            <span>{{ tab.label }}</span>
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-[11px] tabular-nums',
                filter === tab.id
                  ? 'bg-cream/15 text-cream'
                  : 'bg-ink/8 text-ink/60 group-hover:bg-ink/12',
              ]"
            >
              {{ countFor(tab.id) }}
            </span>
          </button>

          <span v-if="searchQuery" class="ml-auto text-[12px] text-ink/55">
            {{ rows.length }} match{{ rows.length === 1 ? '' : 'es' }}
          </span>
        </div>

        <!-- List -->
        <div v-if="rows.length === 0" class="mt-12 rounded-3xl border border-dashed border-mist bg-bone/60 px-6 py-16 text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mist/70">
            <Inbox class="h-5 w-5 text-ink/55" />
          </div>
          <h2 class="mt-5 font-serif text-xl font-semibold tracking-tight text-ink">
            <template v-if="searchQuery">
              No applications match "{{ searchQuery }}".
            </template>
            <template v-else-if="filter === 'pending'">No pending applications.</template>
            <template v-else-if="filter === 'accepted'">No accepted applications yet.</template>
            <template v-else-if="filter === 'declined'">No declined applications.</template>
            <template v-else>No applications yet.</template>
          </h2>
          <p class="mt-2 text-sm text-ink/55">
            <template v-if="searchQuery">Try a different search term.</template>
            <template v-else>Once professionals start applying, they'll show up here.</template>
          </p>
          <Button
            v-if="searchQuery"
            variant="outline"
            class="mt-5 h-10 rounded-full border-ink/20 px-4 text-sm font-medium hover:bg-ink/5"
            @click="searchQuery = ''"
          >
            Clear search
          </Button>
        </div>

        <ul v-else class="mt-6 space-y-3">
          <li v-for="row in rows" :key="row.application.id">
            <ApplicantRow
              :application="row.application"
              :professional="row.professional"
              :shift="row.shift"
              @accept="accept"
              @decline="decline"
            />
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
