<script setup lang="ts">
/**
 * Professional login route view (`/login`).
 *
 * Two-pane editorial layout, mirrors the staff equivalent so the auth set
 * reads as one family. Left: rounded `forest-deep` marketing card with a
 * paired flat-vector illustration, fixed (never scrolls). Right:
 * scrollable form column on the cream page.
 *
 * Includes a small "demo accounts" panel — the mock auth accepts any
 * password >= 6 chars, so the demo emails are how a reviewer signs in
 * quickly without going through registration.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ProfessionalLoginForm from '../components/ProfessionalLoginForm.vue'
import { ROLE_SHORT_LABELS } from '@/modules/professional/enums/Role'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
// Editorial illustration that anchors the marketing card on the left.
// Paired with auth-pro-register.png and the staff auth-* illustrations —
// same flat-vector family, same forest-deep background.
import loginIllustration from '@/assets/illustrations/auth-pro-login.png'

const auth = useAuthStore()

// Show the seed professionals first for clarity, plus any registered ones.
const demoAccounts = computed(() =>
  auth.allProfessionals.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: ROLE_SHORT_LABELS[p.role],
  })),
)
</script>

<template>
  <main class="bg-cream lg:h-dvh lg:overflow-hidden">
    <div class="mx-auto grid min-h-dvh max-w-screen-2xl lg:h-dvh lg:grid-cols-[1.05fr_1fr]">
      <!-- Left: forest marketing card — rounded, fixed, never scrolls.
           Background `#013326` matches the actual hex inside
           `auth-pro-login.png` so the illustration's box dissolves into the
           card. Slightly deeper than the staff cards' `forest-deep`
           (`#003829`); kept inline rather than promoted to a token until the
           paired registration illustration confirms the same value. -->
      <section class="hidden lg:block lg:overflow-hidden lg:p-6">
        <div
          class="relative grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-8 overflow-hidden bg-[#013326] p-12 text-cream lg:rounded-3xl"
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
                For healthcare professionals
              </p>
              <h1 class="font-serif text-[40px] font-semibold leading-[1.05] tracking-tight">
                Pick the shifts you want, when you want them.
              </h1>
              <p class="text-[15px] leading-[1.5] text-cream/75">
                Browse open shifts across Sydney facilities. Apply in one tap,
                hear back fast, and keep your week your own.
              </p>
            </div>
          </div>

          <!-- Footer: cross-audience CTA + back-to-home + tagline -->
          <div class="space-y-4">
            <RouterLink
              to="/staff/login"
              class="group flex items-center justify-between gap-4 rounded-2xl bg-cream/8 px-4 py-3 text-cream transition-colors hover:bg-cream/15"
            >
              <div class="space-y-0.5">
                <p class="text-[10px] uppercase tracking-[0.18em] text-cream/55">
                  Manage a facility instead?
                </p>
                <p class="text-[14px] font-medium">
                  Continue as facility staff
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
               this link on lg+, but it's hidden below lg, so we
               surface it here. -->
          <RouterLink
            to="/"
            class="inline-flex items-center gap-1.5 text-[13px] text-ink/55 transition-colors hover:text-ink lg:hidden"
          >
            <ArrowLeft class="h-3.5 w-3.5" />
            Back to home
          </RouterLink>

          <header class="space-y-3">
            <p class="text-[11px] uppercase tracking-[0.22em] text-ink/55">
              Professional sign in
            </p>
            <h2 class="font-serif text-4xl font-semibold tracking-tight text-ink">
              Welcome back.
            </h2>
            <p class="text-[15px] text-ink/65">
              Sign in to browse open shifts, apply in one tap, and track your
              claims.
            </p>
          </header>

          <ProfessionalLoginForm />

          <p class="text-center text-[14px] text-ink/65">
            New to ShiftLink?
            <RouterLink
              to="/register"
              class="ml-1 font-medium text-ink underline-offset-4 hover:underline"
            >
              Create an account
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
                <span class="font-medium text-ink">
                  {{ account.name }}
                  <span class="ml-1 text-[11px] font-normal uppercase tracking-[0.14em] text-ink/45">
                    {{ account.role }}
                  </span>
                </span>
                <span class="font-mono text-[12px] text-ink/55">{{ account.email }}</span>
              </li>
            </ul>
          </aside>

          <!-- Cross-audience link — staff who land here by accident -->
          <p class="text-center text-[12px] text-ink/50">
            Are you a facility?
            <RouterLink
              to="/staff/login"
              class="ml-1 underline-offset-4 hover:text-ink hover:underline"
            >
              Sign in as facility staff
            </RouterLink>
          </p>
        </div>
      </section>
    </div>
  </main>
</template>
