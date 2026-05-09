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
  <!-- Top-level transition handles route swaps that cross layout
       boundaries (e.g. public landing → facility portal). Within-
       layout transitions are handled inside each layout's own
       RouterView. Keyed on `route.path` so hash navigation (`/#about`)
       doesn't remount the page — only real route changes transition.
       The `page` transition class set is defined in src/assets/main.css. -->
  <RouterView v-slot="{ Component, route }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
</template>
