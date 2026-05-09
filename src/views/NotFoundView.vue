<script setup lang="ts">
/**
 * 404 view — the catch-all and the destination for wrong-audience guard
 * redirects (e.g. a logged-in professional hitting `/staff/login`).
 *
 * Lives in `src/views/` rather than a feature module because it isn't owned
 * by any single feature. Phase C polishes copy + adds the helpful "go to your
 * home" CTA tied to the user's session.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-vue-next'

const auth = useAuthStore()

const homePath = computed<string>(() => {
  if (auth.isFacilityStaff) return '/facility'
  if (auth.isProfessional) return '/professional'
  return '/staff/login'
})

const homeLabel = computed<string>(() => {
  if (auth.isFacilityStaff) return 'Go to your dashboard'
  if (auth.isProfessional) return 'Back to home'
  return 'Sign in'
})
</script>

<template>
  <main class="min-h-dvh bg-cream">
    <div class="mx-auto flex min-h-dvh max-w-3xl flex-col items-start justify-center px-6 py-16 sm:px-10">
      <p class="text-[11px] uppercase tracking-[0.22em] text-ink/55">404</p>
      <h1
        class="mt-3 font-serif text-6xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-7xl"
      >
        That page isn't here.
      </h1>
      <p class="mt-6 max-w-xl text-[17px] leading-relaxed text-ink/65">
        The link might be old, or you might be looking at something the
        prototype doesn't cover yet. Try heading back to where you came from.
      </p>

      <div class="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button
          as-child
          class="h-12 rounded-full bg-marigold px-7 text-[15px] font-medium text-ink hover:bg-marigold/90"
        >
          <RouterLink :to="homePath">
            {{ homeLabel }}
            <ArrowRight class="ml-1.5 h-4 w-4" />
          </RouterLink>
        </Button>
      </div>
    </div>
  </main>
</template>
