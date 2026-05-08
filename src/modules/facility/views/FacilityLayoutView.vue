<script setup lang="ts">
/**
 * Layout for all /facility/* routes.
 *
 * Composes shadcn-vue's SidebarProvider + Inset pattern: sidebar on the left,
 * RouterView on the right inside SidebarInset (which gives correct overflow
 * behavior on desktop and converts to an off-canvas drawer on mobile).
 */
import { onBeforeMount } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useShiftsStore } from '@/stores/shifts'
import { useApplicationsStore } from '@/stores/applications'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import FacilitySidebar from '../components/FacilitySidebar.vue'

const auth = useAuthStore()
const shifts = useShiftsStore()
const applications = useApplicationsStore()

// Prototype: if no one is logged in, sign in as the demo facility staff
// (Sarah Whitfield) so the dashboard isn't blocked by a not-yet-built signup.
// Also hydrate every store the facility portal reads from, so cards / counts
// render correctly on first mount and on direct deep-link visits.
onBeforeMount(() => {
  if (!auth.isFacilityStaff) auth.loginAsFacility()
  shifts.hydrateIfEmpty()
  applications.hydrateIfEmpty()
})
</script>

<template>
  <SidebarProvider>
    <FacilitySidebar />
    <SidebarInset class="bg-cream">
      <!-- Mobile-only top bar that exposes the sidebar trigger -->
      <header
        class="sticky top-0 z-20 flex items-center gap-2 border-b border-mist bg-cream/85 px-4 py-3 backdrop-blur md:hidden"
      >
        <SidebarTrigger class="text-ink hover:bg-ink/5" />
        <span class="font-serif text-lg font-semibold tracking-tight text-ink">ShiftLink</span>
      </header>

      <RouterView />
    </SidebarInset>
  </SidebarProvider>
</template>
