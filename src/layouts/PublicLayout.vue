<script setup lang="ts">
/**
 * PublicLayout — shell for the marketing-side pages and the professional
 * home.
 *
 * Wraps all routes that should show the public header (wordmark + Home /
 * About / Contact / Shift search nav + session-aware actions). Children
 * render via `<RouterView />`.
 *
 * Routes that use this layout:
 *   - `/` (HomeView, placeholder landing)
 *   - `/about`, `/contact` (placeholders)
 *   - `/professional` (logged-in pro home)
 *   - Future `/shifts` shift-search page
 *
 * Routes that do NOT use this layout (intentionally self-contained):
 *   - `/login`, `/register` (professional auth — editorial two-pane)
 *   - `/staff/*` (staff auth + onboarding)
 *   - `/facility/*` (facility portal sidebar shell)
 *   - `/404` (NotFoundView)
 */
import PublicHeader from '@/components/PublicHeader.vue'
</script>

<template>
  <div class="min-h-dvh bg-cream">
    <PublicHeader />
    <!-- Within-layout transition. Keyed on `route.path` so anchor
         navigation (`/#about`) doesn't remount the home page — only
         real route changes (e.g. `/` → `/professional`) transition. -->
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </div>
</template>
