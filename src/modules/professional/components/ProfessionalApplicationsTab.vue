<script setup lang="ts">
/**
 * Applications tab on `/professional`.
 *
 * Mirrors the facility-side Applications view (status pills + search box +
 * empty state), but read-only. Each row is a `ProfessionalApplicationRow`
 * — see that component for the per-application chrome.
 *
 * Data plumbing lives in `useProfessionalApplications()`; this component
 * only owns the layout, the search input, and the filter buttons.
 */

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Inbox, Search, X } from 'lucide-vue-next'
import {
  useProfessionalApplications,
  type ApplicationsFilter,
} from '../composables/useProfessionalApplications'
import ProfessionalApplicationRow from './ProfessionalApplicationRow.vue'

const { filter, searchQuery, rows, counts, cancel } = useProfessionalApplications()

const tabs: ReadonlyArray<{ id: ApplicationsFilter; label: string }> = [
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'declined', label: 'Declined' },
  { id: 'all', label: 'All' },
]

function countFor(id: ApplicationsFilter): number {
  return counts.value[id]
}
</script>

<template>
  <div class="space-y-6">
    <!-- Search -->
    <div class="relative">
      <Search
        class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45"
      />
      <Input
        v-model="searchQuery"
        type="search"
        placeholder="Search by role, location, or your message"
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

    <!-- Status filter pills -->
    <div class="flex flex-wrap items-center gap-2 border-b border-mist pb-4">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        :class="[
          'group inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
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

    <!-- Empty state -->
    <div
      v-if="rows.length === 0"
      class="rounded-3xl border border-dashed border-mist bg-bone/60 px-6 py-16 text-center"
    >
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
        <template v-else>You haven't applied to any shifts yet.</template>
      </h2>
      <p class="mx-auto mt-2 max-w-md text-sm text-ink/55">
        <template v-if="searchQuery">Try a different search term.</template>
        <template v-else>
          Browse open shifts on the shift board and apply with one tap.
          They'll show up here as soon as you do.
        </template>
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

    <!-- List -->
    <ul v-else class="space-y-3">
      <li v-for="row in rows" :key="row.application.id">
        <ProfessionalApplicationRow
          :application="row.application"
          :shift="row.shift"
          @cancel="cancel"
        />
      </li>
    </ul>
  </div>
</template>
