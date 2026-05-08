<script setup lang="ts">
/**
 * The forest-green sidebar for the facility portal.
 *
 * Composes shadcn-vue's primitive Sidebar + SidebarMenu pieces. Reads the
 * current FacilityStaff and Facility from auth so the footer card is real,
 * not lorem-ipsum'd.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth'
import { useShiftsStore } from '@/stores/shifts'
import { useApplicationsStore } from '@/stores/applications'
import facilitiesData from '@/data/facilities.json'
import type { Facility } from '@/modules/facility/types'
import { STAFF_POSITION_LABELS } from '@/modules/facility/enums'
import {
  ArrowLeftRight,
  Inbox,
  ListChecks,
  LogOut,
  Map as MapIcon,
  PlusCircle,
} from 'lucide-vue-next'

const facilities = facilitiesData as Facility[]

const route = useRoute()
const auth = useAuthStore()
const shifts = useShiftsStore()
const applications = useApplicationsStore()

const facility = computed<Facility | null>(() =>
  auth.facilityId ? facilities.find((f) => f.id === auth.facilityId) ?? null : null,
)

const staff = computed(() => auth.currentFacilityStaff)

const initials = computed(() => {
  const name = staff.value?.name ?? ''
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
})

// Single-facility model — every shift belongs to "the facility", so these
// just count everything in the store.
const facilityShiftCount = computed(() => shifts.shifts.length)
const openShiftCount = computed(() => shifts.openShifts.length)

// Surfaces in the sidebar nav as a small attention-grabbing badge.
const pendingApplicationCount = computed(() => applications.pendingTotal)

// Single nav: dashboard renamed to "All posted shifts" so we don't have
// a separate dashboard concept that the brief doesn't ask for.
const navItems = computed(() => [
  {
    label: 'All posted shifts',
    to: '/facility',
    icon: ListChecks,
    active: route.path === '/facility',
    badge: facilityShiftCount.value || null,
  },
  {
    label: 'Post a shift',
    to: '/facility/shifts/new',
    icon: PlusCircle,
    active: route.path === '/facility/shifts/new',
    badge: null,
  },
  {
    label: 'Applications',
    to: '/facility/applications',
    icon: Inbox,
    active: route.path === '/facility/applications',
    badge: pendingApplicationCount.value || null,
  },
  {
    label: 'Shift map',
    to: '/facility/map',
    icon: MapIcon,
    active: route.path === '/facility/map',
    badge: null,
  },
])
</script>

<template>
  <Sidebar collapsible="offcanvas" class="border-r-0">
    <SidebarHeader class="px-5 pt-6 pb-4">
      <div class="flex items-center gap-2.5">
        <!-- Wordmark -->
        <div
          aria-hidden="true"
          class="flex h-8 w-8 items-center justify-center rounded-[10px] bg-marigold font-serif text-base font-semibold leading-none text-ink"
        >
          S
        </div>
        <div class="flex flex-col">
          <span class="font-serif text-lg font-semibold leading-none text-cream">ShiftLink</span>
          <span class="text-[10px] uppercase tracking-[0.22em] text-cream/55">Facility portal</span>
        </div>
      </div>
    </SidebarHeader>

    <SidebarSeparator class="bg-[var(--forest-tint-2)]/60" />

    <SidebarContent class="px-3 py-4">
      <SidebarGroup>
        <SidebarGroupLabel class="text-[10px] uppercase tracking-[0.22em] text-cream/45">
          Workspace
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu class="gap-1">
            <SidebarMenuItem v-for="item in navItems" :key="`${item.to}-${item.label}`">
              <SidebarMenuButton
                as-child
                :data-active="item.active"
                class="h-10 rounded-xl px-3 text-cream/85 hover:bg-[var(--forest-tint-1)] hover:text-cream data-active:bg-marigold data-active:text-ink data-active:font-medium"
              >
                <RouterLink :to="item.to">
                  <component :is="item.icon" class="h-4 w-4 shrink-0" />
                  <span class="flex-1 text-[13px]">{{ item.label }}</span>
                  <span
                    v-if="item.badge !== null"
                    class="rounded-full bg-cream/10 px-2 py-0.5 text-[10px] font-medium tabular-nums text-cream/70"
                  >
                    {{ item.badge }}
                  </span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup class="mt-4">
        <SidebarGroupLabel class="text-[10px] uppercase tracking-[0.22em] text-cream/45">
          At a glance
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div class="grid grid-cols-2 gap-2 px-1">
            <div class="rounded-xl bg-[var(--forest-tint-1)]/55 px-3 py-3">
              <p class="font-serif text-2xl font-semibold leading-none text-cream tabular-nums">
                {{ openShiftCount }}
              </p>
              <p class="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-cream/55">Open</p>
            </div>
            <div class="rounded-xl bg-[var(--forest-tint-1)]/55 px-3 py-3">
              <p class="font-serif text-2xl font-semibold leading-none text-cream tabular-nums">
                {{ facilityShiftCount }}
              </p>
              <p class="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-cream/55">Total</p>
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="border-t border-[var(--forest-tint-2)]/55 px-4 py-4">
      <div v-if="staff && facility" class="space-y-3">
        <div class="flex items-center gap-3">
          <div
            aria-hidden="true"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-cream/12 font-serif text-[13px] font-medium tracking-tight text-cream"
          >
            {{ initials }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[13px] font-medium text-cream">{{ staff.name }}</p>
            <p class="truncate text-[11px] text-cream/55">
              {{ STAFF_POSITION_LABELS[staff.position] }} · {{ facility.name.split(' — ')[0] }}
            </p>
          </div>
        </div>

        <button
          type="button"
          class="group inline-flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[12px] text-cream/60 transition-colors hover:bg-[var(--forest-tint-1)] hover:text-cream"
          @click="auth.logout"
        >
          <span class="inline-flex items-center gap-2">
            <ArrowLeftRight class="h-3.5 w-3.5" />
            Switch / sign out
          </span>
          <LogOut class="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      </div>
    </SidebarFooter>
  </Sidebar>
</template>
