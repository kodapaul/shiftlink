<script setup lang="ts">
/**
 * Professional registration route view (`/register`).
 *
 * Same two-pane editorial frame as the staff equivalent. No onboarding
 * follows registration — professionals route straight to `/professional`
 * after signup.
 */
import { RouterLink } from 'vue-router'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import ProfessionalRegistrationForm from '../components/ProfessionalRegistrationForm.vue'
// Editorial illustration that anchors the marketing card on the left.
// Paired with auth-pro-login.png and the staff auth-* illustrations —
// same flat-vector family, same forest-deep background.
import registrationIllustration from '@/assets/illustrations/auth-pro-register.png'
</script>

<template>
  <main class="bg-cream lg:h-dvh lg:overflow-hidden">
    <div class="mx-auto grid min-h-dvh max-w-screen-2xl lg:h-dvh lg:grid-cols-[1.05fr_1fr]">
      <!-- Left: forest-deep marketing card — rounded, fixed, never scrolls -->
      <section class="hidden lg:block lg:overflow-hidden lg:p-6">
        <div
          class="relative grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-8 overflow-hidden bg-forest-deep p-12 text-cream lg:rounded-3xl"
        >
          <RouterLink to="/" class="font-serif text-2xl font-semibold tracking-tight">
            ShiftLink
          </RouterLink>

          <div class="flex min-h-0 flex-col justify-center gap-6 overflow-hidden">
            <img
              :src="registrationIllustration"
              alt=""
              aria-hidden="true"
              class="mx-auto block min-h-0 w-auto max-w-full flex-shrink object-contain"
              style="max-height: min(38vh, 360px)"
            />

            <div class="max-w-md space-y-4">
              <p class="text-[11px] uppercase tracking-[0.22em] text-cream/60">
                Join ShiftLink
              </p>
              <h1 class="font-serif text-[40px] font-semibold leading-[1.05] tracking-tight">
                Your skills. Your schedule.
              </h1>
              <p class="text-[15px] leading-[1.5] text-cream/75">
                Tell us a little about your work. We'll set you up so you can
                start browsing open shifts in under a minute.
              </p>
            </div>
          </div>

          <!-- Footer: bullets + cross-audience CTA + back-to-home -->
          <div class="space-y-5">
            <ul class="space-y-2.5 text-[13px] text-cream/70">
              <li class="flex items-start gap-2">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" />
                <span>Browse open shifts across Sydney facilities</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" />
                <span>Apply in one tap and get a quick decision</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" />
                <span>Pick what fits your week, skip what doesn't</span>
              </li>
            </ul>

            <RouterLink
              to="/staff/registration"
              class="group flex items-center justify-between gap-4 rounded-2xl bg-cream/8 px-4 py-3 text-cream transition-colors hover:bg-cream/15"
            >
              <div class="space-y-0.5">
                <p class="text-[10px] uppercase tracking-[0.18em] text-cream/55">
                  Looking to manage a facility?
                </p>
                <p class="text-[14px] font-medium">
                  Register as facility staff
                </p>
              </div>
              <ArrowRight
                class="h-4 w-4 shrink-0 text-cream/65 transition-transform group-hover:translate-x-0.5 group-hover:text-cream"
              />
            </RouterLink>

            <RouterLink
              to="/"
              class="inline-flex items-center gap-1.5 text-[12px] text-cream/55 transition-colors hover:text-cream"
            >
              <ArrowLeft class="h-3 w-3" />
              Back to home
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Right: plain scrollable form column -->
      <section class="px-6 py-16 sm:px-10 lg:h-dvh lg:overflow-y-auto lg:py-16">
        <div class="mx-auto w-full max-w-xl space-y-10">
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
              Professional account
            </p>
            <h2 class="font-serif text-4xl font-semibold tracking-tight text-ink">
              Create your account.
            </h2>
            <p class="text-[15px] text-ink/65">
              Two short sections — about you, and a password. We'll drop you
              on the shift board right after.
            </p>
          </header>

          <ProfessionalRegistrationForm />

          <p class="text-center text-[14px] text-ink/65">
            Already have an account?
            <RouterLink
              to="/login"
              class="ml-1 font-medium text-ink underline-offset-4 hover:underline"
            >
              Sign in
            </RouterLink>
          </p>

          <!-- Cross-audience link -->
          <p class="text-center text-[12px] text-ink/50">
            Looking to register a facility?
            <RouterLink
              to="/staff/registration"
              class="ml-1 underline-offset-4 hover:text-ink hover:underline"
            >
              Sign up as facility staff
            </RouterLink>
          </p>
        </div>
      </section>
    </div>
  </main>
</template>
