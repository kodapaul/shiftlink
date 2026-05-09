<script setup lang="ts">
/**
 * Professional home (`/professional`).
 *
 * Renders inside `PublicLayout`, so the wordmark + nav + sign-out live in
 * `PublicHeader`. This view owns:
 *   - The forest-deep welcome hero (full-bleed brand block per BRAND.md)
 *   - A quick-stats row (4 bone cards)
 *   - The three-tab dashboard: Profile / Applications / Schedule
 *
 * Hero illustration reuses `auth-login.png` so the whole healthcare-worker
 * art set reads as one family. Replace with a dashboard-specific
 * illustration later if desired (same prompt rules as in BRAND.md).
 *
 * We hydrate the shifts + applications stores `onBeforeMount` so deep-links
 * and fresh tabs get correct data; the auth store is hydrated by
 * `persistedstate` already.
 */

import { computed, onBeforeMount, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useShiftsStore } from '@/stores/shifts'
import { useApplicationsStore } from '@/stores/applications'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarClock, Inbox, UserCircle2 } from 'lucide-vue-next'
import { ROLE_LABELS } from '@/modules/professional/enums/Role'
import { useProfessionalSchedule } from '../composables/useProfessionalSchedule'
import {
  computeProfileCompleteness,
  emptyProfessionalProfileForm,
  populateProfessionalProfileForm,
} from '../services/ProfessionalProfileForm'
import ProfessionalProfileTab from '../components/ProfessionalProfileTab.vue'
import ProfessionalApplicationsTab from '../components/ProfessionalApplicationsTab.vue'
import ProfessionalScheduleTab from '../components/ProfessionalScheduleTab.vue'
// Decorative — same prompt set as the auth illustrations, paired family.
import dashboardIllustration from '@/assets/illustrations/auth-login.png'

const auth = useAuthStore()
const shifts = useShiftsStore()
const applications = useApplicationsStore()

onBeforeMount(() => {
  shifts.hydrateIfEmpty()
  applications.hydrateIfEmpty()
})

const activeTab = ref<'profile' | 'applications' | 'schedule'>('profile')

// --- Hero data
const proRecord = computed(() => auth.currentProfessional)

const firstName = computed<string>(
  () => proRecord.value?.name?.split(' ')[0] ?? 'there',
)

/** Up-to-two-letter initials for the avatar circle. */
const initials = computed<string>(() => {
  const name = proRecord.value?.name ?? ''
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
})

const roleLabel = computed<string>(() =>
  proRecord.value ? ROLE_LABELS[proRecord.value.role] : '',
)

const yearsLabel = computed<string | null>(() => {
  const y = proRecord.value?.yearsExperience
  if (y === undefined) return null
  return `${y} ${y === 1 ? 'year' : 'years'} experience`
})

/** First preferred location for an inline meta pill. */
const locationLabel = computed<string | null>(() => {
  const list = proRecord.value?.preferredLocations
  if (!list || list.length === 0) return null
  // Strip postcode trailing for a cleaner inline pill.
  return list[0]!.replace(/, NSW\s*\d{4}$/i, ', NSW')
})

const heroSubcopy = computed<string>(() => {
  const bio = proRecord.value?.bio?.trim()
  if (bio) return bio
  return "Welcome back. Pick up where you left off — keep your profile current, review applications, and check what's on your schedule."
})

// --- Stats data
const completeness = computed(() => {
  const values = proRecord.value
    ? populateProfessionalProfileForm(proRecord.value)
    : emptyProfessionalProfileForm()
  return computeProfileCompleteness(values)
})

const { nextShift } = useProfessionalSchedule()

const nextShiftLabel = computed<string>(() => {
  const next = nextShift.value
  if (!next) return '—'
  const d = new Date(next.shift.date + 'T00:00:00')
  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
})
</script>

<template>
  <main class="px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
    <div class="mx-auto max-w-screen-2xl space-y-10">
      <!-- HERO — forest-deep full-bleed block per BRAND.md. Two-column on
           lg: identity + welcome on the left, illustration on the right. -->
      <section
        class="relative overflow-hidden rounded-3xl bg-forest-deep text-cream"
      >
        <div
          class="grid items-stretch gap-8 p-8 sm:p-10 lg:grid-cols-[1.5fr_1fr] lg:gap-12 lg:p-14"
        >
          <!-- Left: identity + welcome -->
          <div class="flex flex-col gap-7">
            <!-- Avatar + role meta inline -->
            <div class="flex items-center gap-4">
              <div
                aria-hidden="true"
                class="flex h-16 w-16 items-center justify-center rounded-full bg-marigold font-serif text-xl font-semibold leading-none text-ink"
              >
                {{ initials }}
              </div>
              <div class="space-y-1">
                <p class="text-[10px] uppercase tracking-[0.22em] text-cream/55">
                  Your dashboard
                </p>
                <p class="text-[14px] text-cream/80">
                  <span class="font-medium text-cream">{{ roleLabel }}</span>
                  <template v-if="yearsLabel"> · {{ yearsLabel }}</template>
                </p>
              </div>
            </div>

            <!-- Welcome headline -->
            <div class="space-y-3">
              <h1
                class="font-serif text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl"
              >
                Welcome, {{ firstName }}.
              </h1>
              <p class="max-w-xl text-[15px] leading-relaxed text-cream/75">
                {{ heroSubcopy }}
              </p>
            </div>

            <!-- Inline meta pills — completeness, location, next shift -->
            <div class="flex flex-wrap gap-2">
              <span
                v-if="completeness.isComplete"
                class="inline-flex items-center gap-1.5 rounded-full border border-sage/50 bg-sage/20 px-3 py-1.5 text-[11px] font-medium text-cream"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-sage" />
                Profile complete
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1.5 rounded-full border border-marigold/50 bg-marigold/20 px-3 py-1.5 text-[11px] font-medium text-cream"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-marigold" />
                Profile {{ completeness.percentage }}% complete
              </span>

              <span
                v-if="locationLabel"
                class="inline-flex items-center gap-1.5 rounded-full bg-cream/8 px-3 py-1.5 text-[11px] text-cream/80"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-cream/50" />
                {{ locationLabel }}
              </span>

              <span
                v-if="nextShift"
                class="inline-flex items-center gap-1.5 rounded-full bg-cream/8 px-3 py-1.5 text-[11px] text-cream/80"
              >
                <CalendarClock class="h-3 w-3" />
                Next shift {{ nextShiftLabel }}
              </span>
            </div>
          </div>

          <!-- Right: illustration -->
          <div class="hidden items-end justify-end lg:flex">
            <img
              :src="dashboardIllustration"
              alt=""
              aria-hidden="true"
              class="block max-h-[320px] w-auto object-contain"
            />
          </div>
        </div>
      </section>

      <!-- TABS — pill-style on a mist surface, matches facility-side ShiftDetailView -->
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="mb-8 bg-mist/60 p-1">
          <TabsTrigger value="profile" class="gap-2 rounded-full px-4 text-[13px]">
            <UserCircle2 class="h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="applications" class="gap-2 rounded-full px-4 text-[13px]">
            <Inbox class="h-3.5 w-3.5" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="schedule" class="gap-2 rounded-full px-4 text-[13px]">
            <CalendarClock class="h-3.5 w-3.5" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" class="focus-visible:outline-none">
          <ProfessionalProfileTab />
        </TabsContent>

        <TabsContent value="applications" class="focus-visible:outline-none">
          <ProfessionalApplicationsTab />
        </TabsContent>

        <TabsContent value="schedule" class="focus-visible:outline-none">
          <ProfessionalScheduleTab />
        </TabsContent>
      </Tabs>
    </div>
  </main>
</template>
