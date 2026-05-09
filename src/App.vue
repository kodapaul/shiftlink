<script setup lang="ts">
import { onMounted } from 'vue'
import { useShiftsStore } from '@/stores/shifts'

const shifts = useShiftsStore()

// Hydrate seed shifts on first load if the persisted store is empty.
onMounted(() => {
  shifts.hydrateIfEmpty()
})
</script>

<template>
  <!-- No App.vue-level transition: FacilityLayoutView's root is
       SidebarProvider, which renders multiple root elements (a Vue
       fragment) and can't be animated by <Transition>. The silent
       failure leaves the leave animation hanging and the page never
       swaps, which causes /facility → /facility/shifts/new to show
       stale content even though the URL changed. Within-layout
       transitions (where content has a proper single DOM root) live
       in PublicLayout and FacilityLayoutView and continue to work.
       Cross-layout swaps just navigate without animation. -->
  <RouterView />
</template>
