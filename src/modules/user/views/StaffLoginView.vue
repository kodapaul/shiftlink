<script setup lang="ts">
/**
 * Staff login route view (`/staff/login`).
 *
 * Two-pane editorial layout. On desktop (lg+):
 *   - Left pane: forest marketing card — rounded, sitting on the cream page
 *     with a gutter around it. Fixed in place; the viewport is locked to
 *     `h-dvh` and the pane has `overflow-hidden` so it never scrolls.
 *   - Right pane: plain scrollable form column on the cream page. Long
 *     forms scroll inside this pane while the left card stays put.
 *
 * On mobile, the left pane hides and the right pane flows naturally as a
 * single scrollable column.
 *
 * Includes a small "demo accounts" panel — the mock auth accepts any
 * password >= 6 chars, so the demo emails are how a reviewer signs in
 * quickly without going through registration.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import StaffLoginForm from '../components/StaffLoginForm.vue'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
// Editorial illustration that anchors the marketing card on the left.
// Vite resolves the import to a hashed asset URL at build time.
import loginIllustration from '@/assets/illustrations/auth-login.png'

const auth = useAuthStore()

// Show the seed staff first for clarity, plus any registered-via-form staff.
const demoAccounts = computed(() =>
  auth.allFacilityStaff.slice(0, 5).map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
  })),
)
</script>

<template>
  <main class="bg-cream lg:h-dvh lg:overflow-hidden">
    <div class="mx-auto grid min-h-dvh max-w-screen-2xl lg:h-dvh lg:grid-cols-[1.05fr_1fr]">
      <!-- Left: forest marketing card — rounded, fixed, never scrolls.
           Uses an explicit 3-row grid (`auto / minmax(0,1fr) / auto`) so the
           top wordmark and bottom tagline take their natural height, and
           the illustration row gets exactly what's left. The middle row
           has `min-h-0 overflow-hidden` so its content can never visually
           collide with the rows above or below on short viewports. -->
      <section class="hidden lg:block lg:overflow-hidden lg:p-6">
        <div
          class="relative grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-8 overflow-hidden bg-forest-deep p-12 text-cream lg:rounded-3xl"
        >
          <RouterLink to="/" class="font-serif text-2xl font-semibold tracking-tight">
            ShiftLink
          </RouterLink>

          <div class="flex min-h-0 flex-col justify-center gap-6 overflow-hidden">
            <img
              :src="loginIllustration"
              alt=""
              aria-hidden="true"
              class="mx-auto block min-h-0 w-auto max-w-full flex-shrink object-contain"
              style="max-height: min(38vh, 360px)"
            />

            <div class="max-w-md space-y-4">
              <p class="text-[11px] uppercase tracking-[0.22em] text-cream/60">
                For facilities
              </p>
              <h1 class="font-serif text-[40px] font-semibold leading-[1.05] tracking-tight">
                The roster gap, closed before your next shift starts.
              </h1>
              <p class="text-[15px] leading-[1.5] text-cream/75">
                Post a shift in under a minute. Get applications from
                credentialled nurses, ENs, AINs and carers — and accept the
                right one with one tap.
              </p>
            </div>
          </div>

          <!-- Footer: cross-audience CTA + back-to-home + tagline -->
          <div class="space-y-4">
            <RouterLink
              to="/login"
              class="group flex items-center justify-between gap-4 rounded-2xl bg-cream/8 px-4 py-3 text-cream transition-colors hover:bg-cream/15"
            >
              <div class="space-y-0.5">
                <p class="text-[10px] uppercase tracking-[0.18em] text-cream/55">
                  Looking for shifts instead?
                </p>
                <p class="text-[14px] font-medium">
                  Continue as a professional
                </p>
              </div>
              <ArrowRight
                class="h-4 w-4 shrink-0 text-cream/65 transition-transform group-hover:translate-x-0.5 group-hover:text-cream"
              />
            </RouterLink>

            <div class="flex flex-wrap items-center justify-between gap-2 text-[12px] text-cream/55">
              <RouterLink
                to="/"
                class="inline-flex items-center gap-1.5 transition-colors hover:text-cream"
              >
                <ArrowLeft class="h-3 w-3" />
                Back to home
              </RouterLink>
              <span>Healthcare shift coverage, designed in Sydney.</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Right: plain scrollable form column. The section is the scroll
           container; the inner div is centered with `mx-auto` rather than
           via flex, because flex's default `align-items: stretch` would
           force the inner div to viewport height and break overflow. -->
      <section class="px-6 py-16 sm:px-10 lg:h-dvh lg:overflow-y-auto lg:py-16">
        <div class="mx-auto w-full max-w-md space-y-10">
          <!-- Mobile-only back-to-home — the left forest card carries
               this link on lg+, but it's hidden below lg. -->
          <RouterLink
            to="/"
            class="inline-flex items-center gap-1.5 text-[13px] text-ink/55 transition-colors hover:text-ink lg:hidden"
          >
            <ArrowLeft class="h-3.5 w-3.5" />
            Back to home
          </RouterLink>

          <header class="space-y-3">
            <p class="text-[11px] uppercase tracking-[0.22em] text-ink/55">
              Facility sign in
            </p>
            <h2 class="font-serif text-4xl font-semibold tracking-tight text-ink">
              Welcome back.
            </h2>
            <p class="text-[15px] text-ink/65">
              Sign in to post shifts, review applicants, and manage your roster.
            </p>
          </header>

          <StaffLoginForm />

          <p class="text-center text-[14px] text-ink/65">
            New to ShiftLink?
            <RouterLink
              to="/staff/registration"
              class="ml-1 font-medium text-ink underline-offset-4 hover:underline"
            >
              Register your facility
              <ArrowRight class="ml-0.5 inline h-3.5 w-3.5" />
            </RouterLink>
          </p>

          <!-- Demo accounts panel -->
          <aside class="rounded-2xl border border-mist bg-bone p-5">
            <p class="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink/55">
              Demo accounts
            </p>
            <p class="mb-3 text-[13px] text-ink/65">
              Mock auth — any password works. Try one of these emails:
            </p>
            <ul class="space-y-1.5 text-[13px] text-ink/75">
              <li
                v-for="account in demoAccounts"
                :key="account.id"
                class="flex flex-wrap items-baseline justify-between gap-x-3"
              >
                <span class="font-medium text-ink">{{ account.name }}</span>
                <span class="font-mono text-[12px] text-ink/55">{{ account.email }}</span>
              </li>
            </ul>
          </aside>
        </div>
      </section>
    </div>
  </main>
</template>
