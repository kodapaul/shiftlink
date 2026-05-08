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
  <RouterView />
</template>
