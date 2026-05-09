<script setup lang="ts">
/**
 * Staff registration route view (`/staff/registration`).
 *
 * Same two-pane editorial frame as login. On desktop (lg+):
 *   - Left pane: forest marketing card — rounded, sitting on the cream page
 *     with a gutter around it. Fixed in place, never scrolls.
 *   - Right pane: plain scrollable form column on cream — important here
 *     since the registration form is taller than a viewport.
 *
 * On mobile, the left pane hides and the right flows as a normal scrollable
 * column.
 */
import { RouterLink } from 'vue-router'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import StaffRegistrationForm from '../components/StaffRegistrationForm.vue'
// Editorial illustration that anchors the marketing card on the left.
// Vite resolves the import to a hashed asset URL at build time.
import registrationIllustration from '@/assets/illustrations/auth-registration.png'
</script>

<template>
  <main class="bg-cream lg:h-dvh lg:overflow-hidden">
    <div class="mx-auto grid min-h-dvh max-w-screen-2xl lg:h-dvh lg:grid-cols-[1.05fr_1fr]">
      <!-- Left: forest marketing card — rounded, fixed, never scrolls.
           See StaffLoginView for the explanation of the 3-row grid layout. -->
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
              style="max-height: min(64vh, 720px)"
            />

            <div class="max-w-md space-y-3">
              <p class="text-[11px] uppercase tracking-[0.22em] text-cream/60">
                Register your facility
              </p>
              <h1 class="font-serif text-[30px] font-semibold leading-[1.1] tracking-tight">
                Set up once. Cover every shift after that in under a minute.
              </h1>
              <p class="text-[14px] leading-[1.5] text-cream/75">
                Tell us about your facility and add yourself as the first
                staff member. We'll walk you through the rest in onboarding.
              </p>
            </div>
          </div>

          <!-- Footer: bullets + cross-audience CTA + back-to-home -->
          <div class="space-y-5">
            <ul class="space-y-2.5 text-[13px] text-cream/70">
              <li class="flex items-start gap-2">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" />
                <span>Post shifts with role, time, location and rate</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" />
                <span>Review applicants and accept the right one in one tap</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" />
                <span>See open and claimed shifts on a live map</span>
              </li>
            </ul>

            <RouterLink
              to="/register"
              class="group flex items-center justify-between gap-4 rounded-2xl bg-cream/8 px-4 py-3 text-cream transition-colors hover:bg-cream/15"
            >
              <div class="space-y-0.5">
                <p class="text-[10px] uppercase tracking-[0.18em] text-cream/55">
                  Looking for shifts instead?
                </p>
                <p class="text-[14px] font-medium">
                  Register as a professional
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

      <!-- Right: plain scrollable form column. The section is the scroll
           container; the inner div is centered with `mx-auto` rather than
           via flex, because flex's default `align-items: stretch` would
           force the inner div to viewport height and break overflow. -->
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
              Facility account
            </p>
            <h2 class="font-serif text-4xl font-semibold tracking-tight text-ink">
              Create your account.
            </h2>
            <p class="text-[15px] text-ink/65">
              Three short sections — facility, you, and a password. We'll set
              up onboarding right after.
            </p>
          </header>

          <StaffRegistrationForm />

          <p class="text-center text-[14px] text-ink/65">
            Already have an account?
            <RouterLink
              to="/staff/login"
              class="ml-1 font-medium text-ink underline-offset-4 hover:underline"
            >
              Sign in
            </RouterLink>
          </p>
        </div>
      </section>
    </div>
  </main>
</template>
