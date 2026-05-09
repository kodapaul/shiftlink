<script setup lang="ts">
/**
 * Public-side header.
 *
 * Renders inside `PublicLayout` for the marketing pages (`/`, `/about`,
 * `/contact`), the future `/shifts` shift-search page, and the professional
 * home (`/professional`). Does NOT render on staff auth, the facility
 * portal, the professional auth pages, or the 404 — those have their own
 * self-contained chrome.
 *
 * Session-aware actions:
 *   - Logged out: two login buttons (facility staff + professional).
 *     Professional gets the marigold pill since they're the larger audience;
 *     staff gets a quieter ghost link.
 *   - Logged in: avatar circle (initials) linking to the user's dashboard,
 *     first name (hidden on mobile), and a Sign out link.
 *
 * Mobile: the inline nav hides and a hamburger button on the right opens
 * a `Sheet` drawer with the same nav links + the same login / sign-out
 * actions. The drawer auto-closes on navigation (each link calls
 * `closeMobileMenu`) so the user lands on their target without an extra tap.
 *
 * The wordmark always links to `/` (the public landing). Sticky on scroll
 * with a soft cream backdrop blur — hairline mist border, no shadow, per
 * BRAND.md.
 */
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { UserType } from '@/modules/user/enums/UserType'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { LogOut, Menu } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()

// Nav targets. `About` and `Contact` are anchor scrolls into the
// landing page rather than separate routes — the marketing copy lives
// in HomeView's `#about` and `#contact` sections, so the header just
// jumps the page there. The router's scrollBehavior handles smooth
// scroll + sticky-header offset.
const navItems = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/#about' },
  { label: 'Contact', to: '/#contact' },
  { label: 'Shift search', to: '/shifts' },
] as const

/** Where the active session "lives" — used for the avatar link target. */
const dashboardPath = computed<string>(() => {
  if (auth.userType === UserType.FacilityStaff) return '/facility'
  if (auth.userType === UserType.Professional) return '/professional'
  return '/'
})

/** Display name for the current session. Shows full Professional or
 *  FacilityStaff name; falls back to "there" if somehow neither selector
 *  resolves. */
const displayName = computed<string>(() => {
  return (
    auth.currentProfessional?.name ??
    auth.currentFacilityStaff?.name ??
    'there'
  )
})

/** First word of the display name — used for the inline header pill so
 *  the right side stays compact. */
const firstName = computed<string>(() => displayName.value.split(' ')[0] ?? '')

/** Up-to-two-letter initials for the avatar circle. */
const initials = computed<string>(() =>
  displayName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join(''),
)

// Sheet open state — bound via v-model:open on the Sheet root so we can
// programmatically close it when the user picks a nav item or signs out.
const mobileMenuOpen = ref<boolean>(false)

function closeMobileMenu(): void {
  mobileMenuOpen.value = false
}

function handleSignOut() {
  closeMobileMenu()
  auth.logout()
  router.push('/')
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-mist bg-cream/85 backdrop-blur">
    <div
      class="mx-auto flex h-16 max-w-screen-2xl items-center gap-6 px-6 sm:px-10"
    >
      <!-- Wordmark -->
      <RouterLink
        to="/"
        class="font-serif text-xl font-semibold tracking-tight text-ink"
      >
        ShiftLink
      </RouterLink>

      <!-- Nav (md+). No active-class — the About/Contact items are
           hash links into the home page, so RouterLink would mark
           Home, About, and Contact all active at once whenever the
           user is on `/`. Cleaner to ship with no active state. -->
      <nav class="ml-2 hidden items-center gap-7 md:flex">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="text-[14px] text-ink/65 transition-colors hover:text-ink"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- Spacer -->
      <span class="flex-1" />

      <!-- Desktop actions (md+) -->
      <div class="hidden items-center gap-2 sm:gap-3 md:flex">
        <!-- Logged-out: two login buttons -->
        <template v-if="!auth.isAuthenticated">
          <Button
            as-child
            variant="ghost"
            class="h-9 rounded-full px-4 text-[13px] text-ink/70 hover:bg-ink/5 hover:text-ink"
          >
            <RouterLink to="/staff/login">Login as facility staff</RouterLink>
          </Button>
          <Button
            as-child
            class="h-9 rounded-full bg-marigold px-4 text-[13px] font-medium text-ink hover:bg-marigold/90"
          >
            <RouterLink to="/login">Login as professional</RouterLink>
          </Button>
        </template>

        <!-- Logged-in: avatar + first name + sign out -->
        <template v-else>
          <RouterLink
            :to="dashboardPath"
            :title="displayName"
            class="flex items-center gap-2.5 rounded-full px-1 py-1 transition-colors hover:bg-ink/5"
          >
            <span
              aria-hidden="true"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-marigold font-serif text-[12px] font-semibold leading-none text-ink"
            >
              {{ initials }}
            </span>
            <span class="hidden pr-2 text-[13px] font-medium text-ink sm:inline">
              {{ firstName }}
            </span>
          </RouterLink>
          <Button
            type="button"
            variant="ghost"
            class="h-9 rounded-full px-3 text-[13px] text-ink/65 hover:bg-ink/5 hover:text-ink"
            @click="handleSignOut"
          >
            Sign out
          </Button>
        </template>
      </div>

      <!-- Mobile: avatar (if signed in, sized to match the trigger height)
           + hamburger trigger. The full nav and login buttons live inside
           the sheet content below. -->
      <div class="flex items-center gap-2 md:hidden">
        <RouterLink
          v-if="auth.isAuthenticated"
          :to="dashboardPath"
          :title="displayName"
          aria-hidden="true"
          class="flex h-9 w-9 items-center justify-center rounded-full bg-marigold font-serif text-[12px] font-semibold leading-none text-ink"
        >
          {{ initials }}
        </RouterLink>

        <Sheet v-model:open="mobileMenuOpen">
          <SheetTrigger as-child>
            <button
              type="button"
              aria-label="Open menu"
              class="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <Menu class="h-5 w-5" />
            </button>
          </SheetTrigger>

          <SheetContent
            side="right"
            class="w-[88vw] max-w-sm border-l border-mist bg-cream p-0"
          >
            <SheetHeader class="border-b border-mist px-6 py-5">
              <SheetTitle
                class="text-left font-serif text-xl font-semibold tracking-tight text-ink"
              >
                ShiftLink
              </SheetTitle>
            </SheetHeader>

            <!-- Body: nav links + actions stacked. Top nav, bottom CTAs. -->
            <div class="flex h-[calc(100%-4.25rem)] flex-col">
              <!-- Logged-in identity strip -->
              <div
                v-if="auth.isAuthenticated"
                class="flex items-center gap-3 border-b border-mist px-6 py-4"
              >
                <span
                  aria-hidden="true"
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-marigold font-serif text-[13px] font-semibold leading-none text-ink"
                >
                  {{ initials }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[14px] font-medium text-ink">
                    {{ displayName }}
                  </p>
                  <p class="truncate text-[12px] text-ink/55">
                    {{
                      auth.userType === UserType.FacilityStaff
                        ? 'Facility staff'
                        : 'Professional'
                    }}
                  </p>
                </div>
              </div>

              <!-- Nav links. No active-class — Home / About / Contact
                   share the `/` route (About/Contact are hash links
                   into the home page) so the active style would mark
                   all three at once. Shipping without an active state
                   reads cleaner. -->
              <nav class="flex flex-col px-2 py-4">
                <RouterLink
                  v-for="item in navItems"
                  :key="item.to"
                  :to="item.to"
                  class="rounded-xl px-4 py-3 text-[15px] text-ink/75 transition-colors hover:bg-ink/5 hover:text-ink"
                  @click="closeMobileMenu"
                >
                  {{ item.label }}
                </RouterLink>
                <RouterLink
                  v-if="auth.isAuthenticated"
                  :to="dashboardPath"
                  class="rounded-xl px-4 py-3 text-[15px] text-ink/75 transition-colors hover:bg-ink/5 hover:text-ink"
                  @click="closeMobileMenu"
                >
                  My dashboard
                </RouterLink>
              </nav>

              <!-- Push CTAs to the bottom -->
              <span class="flex-1" />

              <!-- Bottom CTAs -->
              <div class="space-y-2 border-t border-mist px-6 py-5">
                <template v-if="!auth.isAuthenticated">
                  <Button
                    as-child
                    class="h-11 w-full rounded-full bg-marigold text-[14px] font-medium text-ink hover:bg-marigold/90"
                  >
                    <RouterLink to="/login" @click="closeMobileMenu">
                      Login as professional
                    </RouterLink>
                  </Button>
                  <Button
                    as-child
                    variant="outline"
                    class="h-11 w-full rounded-full border-ink/20 text-[14px] hover:bg-ink/5"
                  >
                    <RouterLink to="/staff/login" @click="closeMobileMenu">
                      Login as facility staff
                    </RouterLink>
                  </Button>
                </template>
                <template v-else>
                  <Button
                    type="button"
                    variant="outline"
                    class="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border-ink/20 text-[14px] hover:bg-ink/5"
                    @click="handleSignOut"
                  >
                    <LogOut class="h-3.5 w-3.5" />
                    Sign out
                  </Button>
                </template>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>
</template>
