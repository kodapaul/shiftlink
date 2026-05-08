<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShiftsStore } from '@/stores/shifts'
import { useApplicationsStore } from '@/stores/applications'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useShiftApplications } from '@/modules/applications/composables/useShiftApplications'
import {
  formatRate,
  formatRelativeDate,
  formatShiftDate,
  formatShiftTimes,
} from '@/helpers/format'
import ShiftOverviewPanel from '../components/ShiftOverviewPanel.vue'
import ShiftApplicationsPanel from '../components/ShiftApplicationsPanel.vue'
import { ArrowLeft, ClipboardList, MapPin, Pencil, Trash2 } from 'lucide-vue-next'
import { ShiftStatus } from '@/modules/shifts/enums'

const route = useRoute()
const router = useRouter()
const shiftsStore = useShiftsStore()
const applicationsStore = useApplicationsStore()

// Hydrate both stores so a deep link to /facility/shifts/:id works on a fresh load.
onMounted(() => {
  shiftsStore.hydrateIfEmpty()
  applicationsStore.hydrateIfEmpty()
})

const shiftId = computed(() => String(route.params.id))
const shift = computed(() => shiftsStore.getById(shiftId.value))

const { pendingCount, applications } = useShiftApplications(shiftId)

// Default tab: applications when there's something to act on, overview otherwise.
type Tab = 'overview' | 'applications'
const activeTab = ref<Tab>('overview')

watch(
  pendingCount,
  (count) => {
    if (count > 0) activeTab.value = 'applications'
  },
  { immediate: true },
)

// Editing.
const canEdit = computed(() => shift.value?.status === ShiftStatus.Open)

function goEdit() {
  if (!shift.value) return
  router.push(`/facility/shifts/${shift.value.id}/edit`)
}

// Deleting (mirrors dashboard's confirm-then-remove pattern).
const deleteOpen = ref(false)

function confirmDelete() {
  if (!shift.value) return
  shiftsStore.remove(shift.value.id)
  deleteOpen.value = false
  router.push('/facility')
}

// Header meta line.
const headerMeta = computed(() => {
  if (!shift.value) return ''
  const date = formatShiftDate(shift.value.date)
  const times = formatShiftTimes(shift.value.startTime, shift.value.endTime)
  const rate = formatRate(shift.value.hourlyRate)
  return `${date} · ${times} · ${rate}`
})
</script>

<template>
  <div class="min-h-svh bg-cream">
    <header class="px-6 pt-10 pb-6 md:px-12 md:pt-14 md:pb-8">
      <div class="mx-auto max-w-5xl">
        <button
          type="button"
          class="group inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-[13px] text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
          @click="router.push('/facility')"
        >
          <ArrowLeft class="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to all shifts
        </button>

        <!-- Found shift: real header. Otherwise: not found state. -->
        <template v-if="shift">
          <div class="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div class="min-w-0 max-w-3xl">
              <p class="text-[11px] uppercase tracking-[0.22em] text-ink/45">Shift</p>
              <h1
                class="mt-2 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-ink md:text-[52px]"
              >
                {{ shift.role }}
              </h1>
              <p class="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-base text-ink/70 md:text-lg">
                <span>{{ headerMeta }}</span>
                <span v-if="shift.location" class="inline-flex items-center gap-1 text-ink/65">
                  <MapPin class="h-3.5 w-3.5 text-ink/45" />
                  {{ shift.location }}
                </span>
                <span class="text-ink/45">· {{ formatRelativeDate(shift.date) }}</span>
              </p>
            </div>

            <div class="flex items-center gap-2">
              <Button
                v-if="canEdit"
                variant="outline"
                class="rounded-full border-mist bg-bone hover:bg-mist/60"
                @click="goEdit"
              >
                <Pencil class="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="ghost"
                class="rounded-full text-ink/70 hover:bg-blush/30 hover:text-ink"
                @click="deleteOpen = true"
              >
                <Trash2 class="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </template>

        <template v-else>
          <h1
            class="mt-8 font-serif text-4xl font-semibold tracking-tight text-ink md:text-[52px]"
          >
            Shift not found.
          </h1>
          <p class="mt-3 max-w-prose text-base text-ink/65">
            The shift may have been deleted or the URL is wrong.
          </p>
        </template>
      </div>
    </header>

    <!-- Tabs -->
    <section v-if="shift" class="px-6 pb-24 md:px-12">
      <div class="mx-auto max-w-5xl">
        <Tabs v-model="activeTab" class="space-y-6">
          <TabsList class="bg-mist/60 p-1">
            <TabsTrigger value="overview" class="rounded-full px-4">Overview</TabsTrigger>
            <TabsTrigger value="applications" class="rounded-full px-4">
              Applications
              <span
                v-if="applications.length"
                class="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-[10px] tabular-nums"
              >
                {{ applications.length }}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" class="focus-visible:outline-none">
            <ShiftOverviewPanel :shift="shift" />
          </TabsContent>

          <TabsContent value="applications" class="focus-visible:outline-none">
            <ShiftApplicationsPanel :shift-id="shift.id" />
          </TabsContent>
        </Tabs>
      </div>
    </section>

    <!-- Delete dialog -->
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
          v-if="shift"
          class="my-2 flex items-center gap-3 rounded-2xl border border-mist bg-cream/60 px-4 py-3 text-sm"
        >
          <ClipboardList class="h-4 w-4 shrink-0 text-ink/55" />
          <p class="truncate text-ink/85">
            {{ shift.role }} · {{ shift.date }} · {{ shift.startTime }}–{{ shift.endTime }}
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
          <Button class="bg-ink text-cream hover:bg-ink/90" @click="confirmDelete">
            Delete shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
