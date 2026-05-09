<script setup lang="ts">
/**
 * Home (`/`) — public landing page.
 *
 * Hero — editorial cream-on-cream. The mockup ships on a light cream
 * surface, so it sits directly on the page rather than in a heavy dark
 * card. Eucalyptus register comes from smaller deliberate accents:
 *
 *   - Dotted-grid texture across the section for editorial depth
 *   - Forest-deep eyebrow pill (hairline border, faint forest tint)
 *   - Marigold accent on the second headline line + a hand-drawn-style
 *     SVG underline beneath it (gives the headline a magazine flourish)
 *   - Floating "feature chip" cards on lg+ — small bone tags positioned
 *     around the headline area that hint at product detail (rate /
 *     credential / location) without competing with the mockup
 *   - Primary CTA: forest-deep filled (signature eucalyptus pattern),
 *     secondary: forest-deep outline
 *   - Soft sage wash behind the mockup, plus the rotated 120+ sticker
 *   - Trust row in a bone strip with mist hairline dividers
 *
 * BRAND check: no shadows, no gradients, marigold reserved for the
 * headline accent + the underline flourish, forest is the structural
 * color, generous editorial spacing, no pure white / black.
 */

import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowRight,
  MapPin,
  BadgeCheck,
  Zap,
  Clock,
  Star,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  Banknote,
  Users,
  Timer,
} from 'lucide-vue-next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import heroMockup from '@/assets/mockups/Hero-Section-landscape.png'
import healthcareWorker from '@/assets/mockups/HealthCare-Worker-bg.png'
import facilityMockup from '@/assets/mockups/facility-mockup.png'
import worker1 from '@/assets/workers/worker-1.png'
import worker2 from '@/assets/workers/worker-2.png'
import worker3 from '@/assets/workers/worker-3.png'
import worker4 from '@/assets/workers/worker-4.png'
import worker5 from '@/assets/workers/worker-5.png'
import worker6 from '@/assets/workers/worker-6.png'
import photo1 from '@/assets/photos/pexels-helen1-5801746.jpg'
import photo2 from '@/assets/photos/pexels-mikhail-nilov-7988082.jpg'
import photo3 from '@/assets/photos/pexels-thirdman-5327578.jpg'

// About-section stats — bottom row of "Making shift coverage..."
// section. Numbers are illustrative for the prototype.
const aboutStats = [
  { value: '120+', label: 'Open shifts in Sydney right now' },
  { value: '850+', label: 'Verified healthcare professionals' },
  { value: '43', label: 'Partner facilities across the basin' },
  { value: '4.9★', label: 'Average facility rating' },
] as const

// Contact section — form is decorative for the prototype. Submitting
// flips the section into a thank-you state for 5 seconds, then resets
// the form and returns to the input view. No network call is made.
const contactForm = ref({ name: '', email: '', message: '' })
const contactSubmitted = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | null = null

function handleContactSubmit() {
  contactSubmitted.value = true
  if (resetTimer) clearTimeout(resetTimer)
  resetTimer = setTimeout(() => {
    contactSubmitted.value = false
    contactForm.value = { name: '', email: '', message: '' }
    resetTimer = null
  }, 5000)
}

// Leaflet map — centered on Sydney CBD with a single ShiftLink pin.
// Same Voyager tile provider as ShiftMap so the visual register
// matches the rest of the app. Scroll-wheel zoom is off so the map
// doesn't hijack the page when users scroll past it.
const contactMapEl = ref<HTMLDivElement | null>(null)
let contactMap: L.Map | null = null
/** Watches the map container; calls `invalidateSize()` when it resizes
 *  so Leaflet redraws tiles correctly if the container started hidden /
 *  zero-size (e.g. below the fold during initial mount, or transitioning
 *  in) and later expanded to its real dimensions. */
let contactMapResizeObserver: ResizeObserver | null = null

const SHIFTLINK_HQ: [number, number] = [-33.8688, 151.2093]

onMounted(() => {
  if (!contactMapEl.value) return

  contactMap = L.map(contactMapEl.value, {
    center: SHIFTLINK_HQ,
    zoom: 13,
    scrollWheelZoom: false,
    zoomControl: true,
    attributionControl: false,
  })

  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    { maxZoom: 19 },
  ).addTo(contactMap)

  // Custom marigold pin — divIcon so it picks up brand colours rather
  // than the default Leaflet blue. Uses Tailwind's animate-ping for
  // the pulsing halo so we don't need to hand-author keyframes.
  const pin = L.divIcon({
    html: `
      <div class="relative h-9 w-9">
        <span class="absolute inset-0 animate-ping rounded-full bg-marigold opacity-40"></span>
        <span class="absolute left-[6px] top-[6px] h-6 w-6 rounded-full border-[3px] border-forest-deep bg-marigold"></span>
      </div>
    `,
    className: 'shiftlink-contact-pin',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })

  L.marker(SHIFTLINK_HQ, { icon: pin })
    .addTo(contactMap)
    .bindPopup(
      '<strong style="font-family: Fraunces, serif;">ShiftLink HQ</strong><br/>Sydney, NSW',
    )

  // ResizeObserver — see comment on `contactMapResizeObserver`. Calls are
  // cheap when the size hasn't actually changed, so it's safe to run
  // every time. Without this Leaflet sometimes only loads a single tile
  // when the container started zero-size on mount.
  if (typeof ResizeObserver !== 'undefined' && contactMapEl.value) {
    contactMapResizeObserver = new ResizeObserver(() => {
      try {
        contactMap?.invalidateSize()
      } catch {
        // Container may be detaching — safe to ignore.
      }
    })
    contactMapResizeObserver.observe(contactMapEl.value)
  }
})

onBeforeUnmount(() => {
  if (resetTimer) clearTimeout(resetTimer)
  if (contactMapResizeObserver) {
    contactMapResizeObserver.disconnect()
    contactMapResizeObserver = null
  }
  contactMap?.remove()
  contactMap = null
})

// Testimonials — six fictional Sydney healthcare professionals across
// the role mix the platform serves (RN, EN, AIN, midwife, carer).
// Each card carries a brand-tint variant + a small per-card rotation
// so the grid reads as a hand-arranged magazine collage instead of a
// uniform "review site" lineup. Tints rotate cream → sage → marigold
// → cream so the eye lands on a different colour every step across
// the row, and rotations alternate sign so the whole grid reads
// balanced rather than tilting one way. `shiftsCount` is a small
// product-detail flourish printed under the role.
const testimonials = [
  {
    name: 'Maya Patel',
    role: 'Registered Nurse',
    avatar: worker1,
    quote:
      'Four years on agency before this. ShiftLink is the first time the rate I see is the rate I actually get paid.',
    tint: 'cream',
    rotate: '-rotate-[0.6deg]',
    shiftsCount: '47 shifts',
  },
  {
    name: "James O'Connor",
    role: 'Enrolled Nurse',
    avatar: worker2,
    quote:
      'Picked up a Saturday night at Bondi Medical and started by 7am the next morning. No paperwork, no phone tag.',
    tint: 'sage',
    rotate: 'rotate-[0.5deg]',
    shiftsCount: '23 shifts',
  },
  {
    name: 'Sienna Liu',
    role: 'AIN · Bachelor of Nursing',
    avatar: worker3,
    quote:
      'Single-shift flexibility means I can work around clinical placements without locking myself into a fortnightly roster.',
    tint: 'marigold',
    rotate: '-rotate-[0.4deg]',
    shiftsCount: '12 shifts',
  },
  {
    name: 'Aisha Rahman',
    role: 'Midwife',
    avatar: worker4,
    quote:
      'Manly Wellness needed cover at 36 hours notice. Apply, confirm, credentials checked — the whole loop was under five minutes.',
    tint: 'cream',
    rotate: 'rotate-[0.7deg]',
    shiftsCount: '34 shifts',
  },
  {
    name: 'Tom Whitaker',
    role: 'Aged Care Carer',
    avatar: worker5,
    quote:
      "I'm semi-retired and just want a couple of mornings a week. ShiftLink is the only platform that doesn't push me toward a full roster.",
    tint: 'sage',
    rotate: '-rotate-[0.5deg]',
    shiftsCount: '18 shifts',
  },
  {
    name: 'Priya Singh',
    role: 'RN, Acute Care',
    avatar: worker6,
    quote:
      "Honestly? It just works. My credentials sit on file, the rate is up front, and every facility I've worked has been the real one.",
    tint: 'marigold',
    rotate: 'rotate-[0.4deg]',
    shiftsCount: '61 shifts',
  },
] as const

// Tailwind class lookup for card tints. Done as a record (not inline
// template literals) so the JIT compiler picks the classes up at
// build time rather than skipping them as dynamic strings.
const tintClasses: Record<(typeof testimonials)[number]['tint'], string> = {
  cream: 'bg-cream border-mist',
  sage: 'bg-sage/35 border-sage/50',
  marigold: 'bg-marigold/15 border-marigold/30',
}

// For-Facilities feature bullets. Same three-bullet structure as the
// pro side, pitched at staff coordinators and DONs. Each lands a
// distinct angle — speed, signal, savings — so the row reads varied
// rather than three flavours of the same point.
const facilityFeatures = [
  {
    icon: Send,
    title: 'Post in 60 seconds',
    body: "Title, time, rate, role. We pre-fill everything else from your facility profile so you're not re-keying the same details every shift.",
  },
  {
    icon: BadgeCheck,
    title: 'Verified credentials only',
    body: 'Every applicant arrives with AHPRA, immunisations, and references already on file — no chasing down paperwork at 6am.',
  },
  {
    icon: Banknote,
    title: 'No agency markups',
    body: "You set the rate. The professional sees what you're paying. No middleman, no per-shift commission, no surprise invoices.",
  },
] as const

// For-Professionals feature bullets. Three is the editorial sweet spot
// — enough to substantiate the pitch, few enough that each lands. Each
// pairs a lucide icon with a tight headline + single-line description.
const proFeatures = [
  {
    icon: Zap,
    title: 'One-tap apply',
    body: 'Your AHPRA, certs, and availability travel with you. No re-keying details for every shift.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified facilities only',
    body: 'Every poster is a credentialled Sydney facility — no agencies in the middle, no surprise rates.',
  },
  {
    icon: Clock,
    title: 'Choose your own hours',
    body: 'Pick a single Saturday night or stack a fortnight of mornings. The shifts work around your life.',
  },
] as const

// Stylized facility wordmarks for the trust row — mixed typography so
// the strip reads like a real cross-section of brands rather than seven
// identical labels. All fictional, scoped to plausible Sydney
// healthcare names.
const trustedFacilities = [
  { label: "St. Vincent's", style: 'font-serif text-[19px] font-semibold tracking-tight' },
  { label: 'BONDI MEDICAL', style: 'text-[12px] font-semibold uppercase tracking-[0.28em]' },
  { label: 'Manly Wellness', style: 'font-serif text-[18px] italic' },
  { label: 'Sydney Mental Health', style: 'text-[14px] font-medium' },
  { label: 'CRONULLA·CARE', style: 'text-[12px] font-bold uppercase tracking-[0.22em]' },
  { label: 'Mosman Memory', style: 'font-serif text-[18px] font-semibold tracking-tight' },
  { label: 'Northside', style: 'text-[15px] font-medium tracking-tight' },
] as const
</script>

<template>
  <main class="bg-cream">
    <!-- Hero — sits directly on the page cream. Section padding controls
         vertical rhythm; no card wrapper. The dotted-grid background and
         floating chips give it editorial polish. -->
    <section
      class="relative overflow-hidden px-6 pb-16 pt-10 sm:px-10 sm:pb-20 sm:pt-14 lg:px-16 lg:pb-24 lg:pt-16"
    >
      <!-- Dotted grid texture — subtle, cream-on-cream. Sits at the very
           back, behind every hero element. Sized 24px so dots feel
           like a real magazine grid rather than noise. The mask fades
           the texture toward the edges so it doesn't fight the trust
           row's hairline divider. -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle,rgba(26,26,26,0.085)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_85%)]"
      />

      <!-- Hero content — sits above the texture via z-index. -->
      <div class="relative z-20 mx-auto flex flex-col items-center text-center">
        <!-- Eyebrow pill — forest-deep on cream, eucalyptus signature. -->
        <span
          class="inline-flex items-center gap-2 rounded-full border border-forest-deep/15 bg-forest-deep/[0.04] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-forest-deep"
        >
          Healthcare shift coverage / Sydney
        </span>

        <!-- Headline. Each phrase stays whole on lg+ via whitespace-nowrap;
             marigold half breaks to its own line by default and joins the
             first line on 2xl monitors. The marigold span wraps an SVG
             underline flourish (hand-drawn squiggle) for editorial flair. -->
        <h1
          class="mt-6 font-serif text-[36px] font-semibold leading-[1.02] tracking-tight text-ink sm:text-[44px] lg:text-[56px] xl:text-[64px] 2xl:text-[80px]"
        >
          <span class="lg:whitespace-nowrap">
            Healthcare shift coverage,
          </span>
          <span
            class="relative inline-block text-marigold lg:whitespace-nowrap"
          >
            designed in Sydney.
            <!-- Hand-drawn-style underline. SVG so it scales with the
                 headline. Uses currentColor (marigold from the parent)
                 so it stays in palette. -->
            <svg
              aria-hidden="true"
              viewBox="0 0 300 12"
              preserveAspectRatio="none"
              class="absolute -bottom-1 left-0 h-2 w-full text-marigold/70 sm:-bottom-1.5 sm:h-2.5"
            >
              <path
                d="M2 8 C 60 2, 140 2, 200 6 S 290 10, 298 4"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
              />
            </svg>
          </span>
        </h1>

        <!-- Subhead — capped at a comfortable measure for body copy. -->
        <p
          class="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-ink/65 sm:text-[17px]"
        >
          ShiftLink connects healthcare facilities with credentialled
          professionals — RNs, ENs, AINs, carers, and midwives. Post a
          shift in under a minute. Apply in one tap.
        </p>

        <!-- CTAs — forest-deep primary (signature eucalyptus pattern),
             forest outline secondary. -->
        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            as-child
            class="h-11 rounded-full bg-forest-deep px-6 text-[14px] font-medium text-cream hover:bg-forest-deep/90"
          >
            <RouterLink to="/register">
              Sign up as professional
              <ArrowRight class="ml-1.5 h-4 w-4" />
            </RouterLink>
          </Button>
          <Button
            as-child
            variant="outline"
            class="h-11 rounded-full border-forest-deep/30 bg-transparent px-6 text-[14px] text-forest-deep hover:bg-forest-deep/[0.04] hover:text-forest-deep"
          >
            <RouterLink to="/staff/registration">
              Sign up as facility staff
            </RouterLink>
          </Button>
        </div>

        <!-- Mockup with editorial backdrop. A single soft sage wash
             sits behind the image so the cream-on-cream comp has a
             focal point. -->
        <div class="relative mt-12 w-full max-w-5xl sm:mt-14">
          <!-- Soft sage wash — large rounded shape behind the mockup.
               Visible on all sizes; insets shrink on mobile so it
               stays proportional to the smaller image. -->
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-x-2 top-4 bottom-[-0.75rem] rounded-[1.5rem] bg-sage/45 sm:inset-x-4 sm:top-8 sm:bottom-[-1.5rem] sm:rounded-[2.5rem]"
          />

          <!-- 120+ sticker — magazine cut-out card. On mobile sits
               compactly inside the mockup's top-left corner; on lg+
               grows bigger and sticks out past the edge. -->
          <div
            aria-hidden="true"
            class="absolute left-1 top-1 z-30 -rotate-[6deg] rounded-xl border border-forest-deep/15 bg-bone px-2.5 py-1.5 text-ink lg:-left-2 lg:top-6 lg:rounded-2xl lg:px-4 lg:py-3"
          >
            <p
              class="text-[8px] font-medium uppercase tracking-[0.18em] text-ink/55 lg:text-[10px]"
            >
              Across
            </p>
            <p
              class="font-serif text-lg font-semibold leading-none tabular-nums text-forest-deep lg:text-3xl"
            >
              120+
            </p>
            <p
              class="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-ink/55 lg:mt-1.5 lg:text-[11px]"
            >
              shifts open
            </p>
          </div>

          <!-- Floating UI annotation chips. Mobile shows two compact
               pills tucked inside the mockup bounds; xl+ swaps to
               larger pills sticking out past the edges, plus a third
               $48/hr card on the bottom-left. -->
          <div
            aria-hidden="true"
            class="absolute right-1 top-2 z-30 inline-flex rotate-[4deg] items-center gap-1.5 rounded-full border border-mist bg-bone px-2.5 py-1 xl:-right-4 xl:top-10 xl:gap-2 xl:px-3.5 xl:py-2"
          >
            <MapPin class="h-3 w-3 text-forest-deep xl:h-3.5 xl:w-3.5" />
            <span class="text-[10px] font-medium text-ink/75 xl:text-[12px]">
              Sydney CBD
            </span>
          </div>

          <div
            aria-hidden="true"
            class="absolute bottom-2 right-1 z-30 inline-flex -rotate-[3deg] items-center gap-1.5 rounded-full border border-marigold/40 bg-marigold/20 px-2.5 py-1 xl:bottom-12 xl:-right-6 xl:gap-2 xl:px-3.5 xl:py-2"
          >
            <BadgeCheck class="h-3 w-3 text-forest-deep xl:h-3.5 xl:w-3.5" />
            <span class="text-[10px] font-medium text-ink/80 xl:text-[12px]">
              AHPRA verified
            </span>
          </div>

          <!-- $48/hr card — xl+ only, would crowd the mobile mockup -->
          <div
            aria-hidden="true"
            class="absolute -left-4 bottom-8 z-30 hidden -rotate-[5deg] rounded-2xl border border-mist bg-bone px-4 py-3 text-left xl:block"
          >
            <p class="text-[10px] font-medium uppercase tracking-[0.18em] text-ink/50">
              Avg. rate
            </p>
            <p class="mt-0.5 font-serif text-2xl font-semibold leading-none tabular-nums text-forest-deep">
              $48<span class="text-[14px] font-medium text-ink/55">/hr</span>
            </p>
          </div>

          <img
            :src="heroMockup"
            alt="ShiftLink — desktop dashboard and mobile views"
            class="relative z-10 mx-auto block w-full"
          />
        </div>
      </div>
    </section>

    <!-- Trust row — bone strip with hairline mist divider. -->
    <section
      class="border-y border-mist bg-bone px-6 py-10 sm:px-10 sm:py-12 lg:px-16"
    >
      <div class="mx-auto max-w-6xl text-center">
        <p
          class="text-[10px] font-medium uppercase tracking-[0.28em] text-ink/45"
        >
          Trusted by Sydney facilities
        </p>
        <ul
          class="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 text-ink/55"
        >
          <li
            v-for="brand in trustedFacilities"
            :key="brand.label"
            :class="['transition-colors hover:text-ink', brand.style]"
          >
            {{ brand.label }}
          </li>
        </ul>
      </div>
    </section>

    <!-- For Professionals — editorial two-column. Image left framed by
         a forest-deep offset block + marigold accent dot, copy right
         with eyebrow → serif headline → 3 feature bullets → CTA. The
         asymmetric layout deliberately contrasts the centered hero
         above so the page builds rhythm rather than feeling stacked. -->
    <section
      id="for-pros"
      class="px-6 py-20 sm:px-10 sm:py-24 lg:px-16 lg:py-28"
    >
      <div
        class="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20"
      >
        <!-- Image column — the bg-art version has its own backdrop
             baked in, so no card/offset decorations here. Capped at
             max-w-md to stay in scale with the copy column. Floating
             feature pills sit on the edges of the image as product
             callouts that echo the bullets in the right column. -->
        <div class="relative mx-auto w-full max-w-md">
          <img
            :src="healthcareWorker"
            alt="A healthcare professional reviewing the ShiftLink app on their phone"
            class="relative z-10 block w-full"
          />

          <!-- AHPRA verified pill — marigold-tinted, top-right edge,
               slight tilt. Echoes the "Verified facilities only"
               feature bullet. -->
          <div
            aria-hidden="true"
            class="absolute right-1 top-6 z-20 inline-flex rotate-[4deg] items-center gap-1.5 rounded-full border border-marigold/40 bg-marigold/20 px-3 py-1.5 backdrop-blur-sm sm:-right-4 sm:gap-2 sm:px-3.5 sm:py-2"
          >
            <BadgeCheck class="h-3.5 w-3.5 text-forest-deep sm:h-4 sm:w-4" />
            <span class="text-[11px] font-medium text-ink/80 sm:text-[12px]">
              AHPRA verified
            </span>
          </div>

          <!-- One-tap apply card — bone, mid-left edge, counter tilt.
               Echoes the "One-tap apply" feature bullet. -->
          <div
            aria-hidden="true"
            class="absolute -left-2 top-1/2 z-20 inline-flex -rotate-[5deg] items-center gap-2 rounded-2xl border border-mist bg-bone px-3 py-2 sm:-left-6 sm:px-3.5 sm:py-2.5"
          >
            <span
              class="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-forest-deep text-cream"
            >
              <Zap class="h-3.5 w-3.5" />
            </span>
            <div class="text-left leading-tight">
              <p class="text-[10px] font-medium uppercase tracking-[0.14em] text-ink/55">
                Applied
              </p>
              <p class="font-serif text-[14px] font-semibold text-ink">
                in 6 seconds
              </p>
            </div>
          </div>

          <!-- 4.9 rating pill — bottom-right corner, marigold star,
               echoes the "trusted facilities" / quality angle. -->
          <div
            aria-hidden="true"
            class="absolute bottom-8 right-2 z-20 inline-flex rotate-[3deg] items-center gap-1.5 rounded-full border border-mist bg-bone px-3 py-1.5 sm:-right-3 sm:bottom-12 sm:gap-2 sm:px-3.5 sm:py-2"
          >
            <Star class="h-3.5 w-3.5 fill-marigold text-marigold sm:h-4 sm:w-4" />
            <span class="text-[11px] font-medium text-ink/80 sm:text-[12px]">
              <span class="font-serif font-semibold text-ink">4.9</span>
              · facility rating
            </span>
          </div>
        </div>

        <!-- Copy column. -->
        <div class="text-left">
          <span
            class="inline-flex items-center gap-2 rounded-full border border-forest-deep/15 bg-forest-deep/[0.04] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-forest-deep"
          >
            For professionals
          </span>

          <h2
            class="mt-6 font-serif text-[32px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[40px] lg:text-[48px]"
          >
            Pick the shifts
            <span class="text-marigold">that fit you.</span>
          </h2>

          <p
            class="mt-5 max-w-xl text-[15px] leading-relaxed text-ink/65 sm:text-[17px]"
          >
            Whether you're a graduate RN picking up your first weekend
            shifts or a senior carer stitching a flexible roster
            together, ShiftLink is built around the way Sydney
            healthcare actually works.
          </p>

          <!-- Feature bullets — icon + title + body, vertically stacked
               with hairline mist dividers between rows. -->
          <ul class="mt-9 space-y-6">
            <li
              v-for="(feature, idx) in proFeatures"
              :key="feature.title"
              :class="[
                'flex gap-4',
                idx > 0 && 'border-t border-mist pt-6',
              ]"
            >
              <span
                class="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-forest-deep/10 bg-bone text-forest-deep"
              >
                <component :is="feature.icon" class="h-5 w-5" />
              </span>
              <div>
                <p class="font-serif text-[18px] font-semibold text-ink">
                  {{ feature.title }}
                </p>
                <p class="mt-1 text-[14px] leading-relaxed text-ink/65">
                  {{ feature.body }}
                </p>
              </div>
            </li>
          </ul>

          <!-- CTA — forest-deep filled, matches the hero primary. -->
          <div class="mt-10">
            <Button
              as-child
              class="h-11 rounded-full bg-forest-deep px-6 text-[14px] font-medium text-cream hover:bg-forest-deep/90"
            >
              <RouterLink to="/register">
                Create your professional profile
                <ArrowRight class="ml-1.5 h-4 w-4" />
              </RouterLink>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- For Facilities — mirror of For Professionals but flipped:
         copy on the left, image on the right. The flip creates the
         editorial rhythm of a magazine spread (left-image /
         right-image) and lets the page treat the two audiences with
         equal visual weight. Stays on cream so the cream→bone
         alternation with Testimonials below holds. Graphic overlay
         layers (dotted texture, sage curve, marigold halo, confetti
         shapes) match the editorial polish of Testimonials and About
         so this section doesn't sit visually flat between them. -->
    <section
      id="for-facilities"
      class="relative overflow-hidden border-t border-mist bg-cream px-6 py-20 sm:px-10 sm:py-24 lg:px-16 lg:py-28"
    >
      <!-- Graphic overlay layer 1 — dotted texture, edge-masked. -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle,rgba(26,26,26,0.06)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_85%)]"
      />

      <!-- Graphic overlay layer 2 — marigold radial halo bottom-left.
           Anchors the warm-toned CTA at the bottom of the copy column
           with a soft glow behind it. -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -bottom-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-marigold/20 blur-3xl"
      />

      <!-- Graphic overlay layer 3 — sage SVG curve sweeping the
           top-right behind the image column. Hand-drawn flourish that
           gives the dashboard mockup a soft frame. lg+ only so it
           doesn't crowd mobile. -->
      <svg
        aria-hidden="true"
        viewBox="0 0 600 220"
        preserveAspectRatio="none"
        class="pointer-events-none absolute -right-16 -top-8 hidden h-44 w-[520px] text-sage/55 lg:block"
      >
        <path
          d="M10 60 C 130 180, 260 180, 380 100 S 540 20, 590 140"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>

      <!-- Graphic overlay layer 4 — confetti shapes scattered around
           the section. Small marigold dot, forest-deep ring, sage
           rotated square. lg+ only. -->
      <span
        aria-hidden="true"
        class="pointer-events-none absolute left-[6%] top-[18%] hidden h-3 w-3 rounded-full bg-marigold/80 lg:block"
      />
      <span
        aria-hidden="true"
        class="pointer-events-none absolute right-[10%] bottom-[24%] hidden h-2.5 w-2.5 rounded-full border-2 border-forest-deep/40 lg:block"
      />
      <span
        aria-hidden="true"
        class="pointer-events-none absolute left-[40%] bottom-[10%] hidden h-3 w-3 rotate-45 rounded-sm bg-sage/80 lg:block"
      />

      <div
        class="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20"
      >
        <!-- Image column — sits FIRST in the DOM so it's visible
             immediately on mobile (above the long copy column) and
             matches the For-Pros mobile pattern. On lg+ it flips to
             the right via grid order, mirroring For-Pros for the
             magazine spread effect. Capped wider than the For-Pros
             image since the facility mockup is a dashboard with more
             content density. -->
        <div class="relative mx-auto w-full max-w-lg lg:order-2 lg:max-w-xl">
          <img
            :src="facilityMockup"
            alt="ShiftLink facility dashboard — post a shift, review applicants, manage roster"
            class="relative z-10 block w-full"
          />

          <!-- Filled in 8min pill — top-right, marigold tint, echoes
               the speed angle of the first feature bullet. -->
          <div
            aria-hidden="true"
            class="absolute right-1 top-6 z-20 inline-flex rotate-[4deg] items-center gap-1.5 rounded-full border border-marigold/40 bg-marigold/20 px-3 py-1.5 backdrop-blur-sm sm:-right-4 sm:gap-2 sm:px-3.5 sm:py-2"
          >
            <Timer class="h-3.5 w-3.5 text-forest-deep sm:h-4 sm:w-4" />
            <span class="text-[11px] font-medium text-ink/80 sm:text-[12px]">
              Filled in 8 min
            </span>
          </div>

          <!-- 12 applicants card — mid-left, bone, counter tilt. Echoes
               the depth/quality angle of verified credentials. -->
          <div
            aria-hidden="true"
            class="absolute -left-2 top-1/2 z-20 inline-flex -rotate-[5deg] items-center gap-2 rounded-2xl border border-mist bg-bone px-3 py-2 sm:-left-6 sm:px-3.5 sm:py-2.5"
          >
            <span
              class="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-forest-deep text-cream"
            >
              <Users class="h-3.5 w-3.5" />
            </span>
            <div class="text-left leading-tight">
              <p class="text-[10px] font-medium uppercase tracking-[0.14em] text-ink/55">
                Applicants
              </p>
              <p class="font-serif text-[14px] font-semibold text-ink">
                12 verified
              </p>
            </div>
          </div>

          <!-- Saved $420 pill — bottom-right, bone, slight tilt.
               Echoes the no-markups savings angle. -->
          <div
            aria-hidden="true"
            class="absolute bottom-8 right-2 z-20 inline-flex rotate-[3deg] items-center gap-1.5 rounded-full border border-mist bg-bone px-3 py-1.5 sm:-right-3 sm:bottom-12 sm:gap-2 sm:px-3.5 sm:py-2"
          >
            <Banknote class="h-3.5 w-3.5 text-forest-deep sm:h-4 sm:w-4" />
            <span class="text-[11px] font-medium text-ink/80 sm:text-[12px]">
              <span class="font-serif font-semibold text-ink">$420</span>
              · saved vs agency
            </span>
          </div>
        </div>

        <!-- Copy column — on lg+ takes order-1 so it sits to the left
             of the image; on mobile (no order applied) it falls below
             the image-first DOM order, keeping the image visible at
             the top of the section. -->
        <div class="text-left lg:order-1">
          <span
            class="inline-flex items-center gap-2 rounded-full border border-forest-deep/15 bg-forest-deep/[0.04] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-forest-deep"
          >
            For facilities
          </span>

          <h2
            class="mt-6 font-serif text-[32px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[40px] lg:text-[48px]"
          >
            Post a shift.
            <span class="text-marigold">Fill it before lunch.</span>
          </h2>

          <p
            class="mt-5 max-w-xl text-[15px] leading-relaxed text-ink/65 sm:text-[17px]"
          >
            Whether you're a 40-bed aged-care home covering a single
            sick-call or a hospital running an open-shift board across
            three wards, ShiftLink puts the rate, the role, and the
            roster in your hands.
          </p>

          <ul class="mt-9 space-y-6">
            <li
              v-for="(feature, idx) in facilityFeatures"
              :key="feature.title"
              :class="[
                'flex gap-4',
                idx > 0 && 'border-t border-mist pt-6',
              ]"
            >
              <span
                class="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-forest-deep/10 bg-bone text-forest-deep"
              >
                <component :is="feature.icon" class="h-5 w-5" />
              </span>
              <div>
                <p class="font-serif text-[18px] font-semibold text-ink">
                  {{ feature.title }}
                </p>
                <p class="mt-1 text-[14px] leading-relaxed text-ink/65">
                  {{ feature.body }}
                </p>
              </div>
            </li>
          </ul>

          <div class="mt-10">
            <Button
              as-child
              class="h-11 rounded-full bg-forest-deep px-6 text-[14px] font-medium text-cream hover:bg-forest-deep/90"
            >
              <RouterLink to="/staff/registration">
                Post your first shift
                <ArrowRight class="ml-1.5 h-4 w-4" />
              </RouterLink>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials — six Sydney healthcare professionals. Bone
         section with a graphic overlay (giant marigold serif quote
         watermark + scattered dot texture + sage curve) and varied
         brand-tint cards on a 3-col grid. The collage feel comes from
         per-card tilts and tint rotation — cream → sage → marigold —
         so the row scans as hand-arranged rather than templated. -->
    <section
      id="testimonials"
      class="relative overflow-hidden border-y border-mist bg-bone px-6 py-20 sm:px-10 sm:py-24 lg:px-16 lg:py-28"
    >
      <!-- Graphic overlay layer 1 — dotted texture across the whole
           section, masked toward the edges so it fades out. Same
           pattern as the hero so the page has visual continuity. -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle,rgba(26,26,26,0.075)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_85%)]"
      />

      <!-- Graphic overlay layer 2 — giant marigold serif quote mark,
           sits behind the header as a magazine watermark. Big enough
           to be unmistakably decorative, low-opacity so it doesn't
           fight the body copy. -->
      <span
        aria-hidden="true"
        class="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 font-serif text-[280px] font-semibold leading-none text-marigold/15 sm:top-8 sm:text-[360px] lg:text-[440px]"
      >
        "
      </span>

      <!-- Graphic overlay layer 3 — sage SVG curve, sweeping across
           the bottom-left to add a hand-drawn flourish. Hidden on
           small viewports where it would crowd the cards. -->
      <svg
        aria-hidden="true"
        viewBox="0 0 600 200"
        preserveAspectRatio="none"
        class="pointer-events-none absolute -bottom-6 -left-12 hidden h-40 w-[480px] text-sage/55 lg:block"
      >
        <path
          d="M10 150 C 120 30, 280 30, 400 110 S 560 180, 590 60"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>

      <!-- Graphic overlay layer 4 — small marigold asterisk dots
           scattered as confetti. Decorative only, lg+ only. -->
      <span
        aria-hidden="true"
        class="pointer-events-none absolute right-[8%] top-[14%] hidden h-3 w-3 rotate-12 rounded-full bg-marigold/70 lg:block"
      />
      <span
        aria-hidden="true"
        class="pointer-events-none absolute left-[12%] top-[40%] hidden h-2 w-2 rounded-full bg-forest-deep/40 lg:block"
      />
      <span
        aria-hidden="true"
        class="pointer-events-none absolute right-[14%] bottom-[18%] hidden h-2.5 w-2.5 rotate-45 rounded-sm bg-sage lg:block"
      />

      <div class="relative mx-auto max-w-7xl">
        <!-- Header -->
        <div class="mx-auto max-w-3xl text-center">
          <span
            class="inline-flex items-center gap-2 rounded-full border border-forest-deep/15 bg-forest-deep/[0.04] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-forest-deep"
          >
            Voices from the ward
          </span>
          <h2
            class="mt-6 font-serif text-[32px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[40px] lg:text-[48px]"
          >
            Loved by Sydney's
            <span class="text-marigold">healthcare professionals.</span>
          </h2>
          <p
            class="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink/65 sm:text-[17px]"
          >
            From acute-care RNs picking up a single Saturday to midwives
            running a flexible week — the people doing the work, in
            their own words.
          </p>
        </div>

        <!-- Cards grid. Per-card tilt + tint rotation reads as a
             magazine collage. Cards have hover lift to feel
             interactive without resorting to drop shadows. -->
        <ul
          class="mt-14 grid gap-5 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
        >
          <li
            v-for="t in testimonials"
            :key="t.name"
            :class="[
              'relative flex flex-col rounded-3xl border p-7 transition-transform duration-300 hover:!rotate-0 sm:p-8',
              tintClasses[t.tint],
              t.rotate,
            ]"
          >
            <!-- Per-card serif quote glyph, top-right -->
            <span
              aria-hidden="true"
              class="pointer-events-none absolute right-5 top-2 font-serif text-6xl font-semibold leading-none text-forest-deep/30 sm:right-6 sm:top-3 sm:text-7xl"
            >
              "
            </span>

            <!-- 5-star rating — five marigold stars, small, lively
                 visual touch. Sits above the quote so the eye lands
                 on a familiar review-style cue first. -->
            <div
              aria-label="5 out of 5 stars"
              class="relative z-10 flex items-center gap-0.5"
            >
              <Star
                v-for="i in 5"
                :key="i"
                class="h-4 w-4 fill-marigold text-marigold"
              />
            </div>

            <!-- Quote body -->
            <blockquote
              class="relative z-10 mt-4 text-[15px] leading-relaxed text-ink/80 sm:text-[16px]"
            >
              {{ t.quote }}
            </blockquote>

            <!-- Attribution row, anchored to the card bottom -->
            <div
              class="mt-7 flex items-center gap-3 border-t border-ink/10 pt-5"
            >
              <img
                :src="t.avatar"
                :alt="`Portrait of ${t.name}`"
                class="h-12 w-12 flex-none rounded-full border border-ink/10 bg-bone object-cover"
              />
              <div class="flex-1 leading-tight">
                <p class="font-serif text-[15px] font-semibold text-ink">
                  {{ t.name }}
                </p>
                <p class="mt-0.5 text-[12px] text-ink/55">
                  {{ t.role }}
                </p>
              </div>
              <!-- Shifts-count flourish — small product-detail anchor
                   that pulls the testimonial from "stock review" into
                   "this is a real ShiftLink user". -->
              <div class="flex flex-none flex-col items-end leading-tight">
                <span class="font-serif text-[16px] font-semibold tabular-nums text-forest-deep">
                  {{ t.shiftsCount.split(' ')[0] }}
                </span>
                <span class="text-[10px] uppercase tracking-[0.14em] text-ink/45">
                  shifts
                </span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- About — two-part spread inspired by editorial agency landings.
         Top: centered headline + bento grid of three photos and two
         brand-tinted stat tiles. Bottom: two-column mission block with
         a four-stat row underneath, divided by vertical hairlines. The
         section gets a soft "graphic gradient" background — two large
         radial blobs (sage top-left, marigold bottom-right) at low
         opacity — so the bento doesn't sit on flat cream. -->
    <section
      id="about"
      class="relative overflow-hidden bg-cream"
    >
      <!-- Graphic gradient backdrop. Two radial halos add depth without
           crossing into saturated SaaS-gradient territory: a sage
           halo at top-left and a marigold halo at bottom-right, each
           soft enough that the cream still reads as the dominant
           surface. Pointer-events-none so it never blocks clicks. -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_15%_10%,rgba(184,201,168,0.55),transparent_45%),radial-gradient(circle_at_85%_85%,rgba(240,187,55,0.30),transparent_50%)]"
      />

      <!-- Top half — centered headline + bento grid -->
      <div
        class="relative px-6 pb-16 pt-20 sm:px-10 sm:pb-20 sm:pt-24 lg:px-16 lg:pb-24 lg:pt-28"
      >
        <div class="mx-auto max-w-7xl">
          <!-- Header -->
          <div class="mx-auto max-w-3xl text-center">
            <span
              class="inline-flex items-center gap-2 rounded-full border border-forest-deep/15 bg-forest-deep/[0.04] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-forest-deep"
            >
              About ShiftLink
            </span>
            <h2
              class="mt-6 font-serif text-[34px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[44px] lg:text-[56px]"
            >
              Where shift coverage
              <span class="text-marigold">meets the floor.</span>
            </h2>
            <p
              class="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-ink/65 sm:text-[17px]"
            >
              ShiftLink was built in Sydney for Sydney — closing the gap
              between facilities that need cover and the credentialled
              professionals already in the basin.
            </p>
          </div>

          <!-- Bento grid. Mobile stacks all six tiles vertically; sm+
               goes 2-col; lg+ becomes the magazine-style asymmetric
               layout: one tall photo on the left spanning two rows,
               then 2×2 of stat tile + photo across the remaining
               columns. -->
          <div
            class="mt-14 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:grid-rows-2"
          >
            <!-- Tall left photo — spans 2 rows on lg+. Aspect-ratio
                 keeps it consistent across breakpoints. -->
            <figure
              class="relative aspect-[4/5] overflow-hidden rounded-3xl sm:row-span-1 sm:aspect-[4/5] lg:row-span-2 lg:aspect-auto"
            >
              <img
                :src="photo1"
                alt="Sydney healthcare professional at work"
                class="h-full w-full object-cover"
              />
            </figure>

            <!-- Marigold stat tile — top-middle on lg+. Subtle inner
                 gradient gives the colour fill the depth the user
                 asked for without veering corporate. -->
            <div
              class="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-marigold to-[#e2a417] p-7 text-ink sm:p-8"
            >
              <div>
                <p class="font-serif text-[44px] font-semibold leading-none tabular-nums sm:text-[52px] lg:text-[60px]">
                  60%
                </p>
              </div>
              <p class="mt-6 text-[15px] font-medium leading-snug sm:text-[17px]">
                Faster shift fill vs. agency phone-tag.
              </p>
            </div>

            <!-- Top-right photo -->
            <figure class="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <img
                :src="photo2"
                alt="Healthcare team collaborating"
                class="h-full w-full object-cover"
              />
            </figure>

            <!-- Bottom-middle photo -->
            <figure class="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <img
                :src="photo3"
                alt="Healthcare professional reviewing notes"
                class="h-full w-full object-cover"
              />
            </figure>

            <!-- Forest-deep stat tile, bottom-right. Cream type on a
                 deep gradient — the inverse of the marigold tile so
                 the bento has tonal balance. -->
            <div
              class="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-forest-deep to-[#012015] p-7 text-cream sm:p-8"
            >
              <div>
                <p class="font-serif text-[44px] font-semibold leading-none tabular-nums sm:text-[52px] lg:text-[60px]">
                  &lt;5min
                </p>
              </div>
              <p class="mt-6 text-[15px] font-medium leading-snug text-cream/85 sm:text-[17px]">
                From shift posted to professional confirmed.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom half — mission spread + four-stat row -->
      <div
        class="relative border-t border-mist bg-bone/70 px-6 py-20 sm:px-10 sm:py-24 lg:px-16 lg:py-28"
      >
        <div class="mx-auto max-w-7xl">
          <!-- Mission split — 2 columns on lg+, stacks on mobile. The
               headline anchors the left, the prose lives on the right.
               Asymmetric weight is deliberately editorial. -->
          <div class="grid gap-10 lg:grid-cols-2 lg:gap-20">
            <h3
              class="font-serif text-[32px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[40px] lg:text-[44px]"
            >
              Built around how
              <span class="text-marigold">Sydney healthcare</span>
              actually works.
            </h3>
            <div class="space-y-5 text-[15px] leading-relaxed text-ink/70 sm:text-[16px]">
              <p>
                ShiftLink started from a simple observation — Sydney
                facilities were paying agency markups for shifts that
                local professionals would have happily taken directly,
                if only the connection existed. So we built it.
              </p>
              <p>
                The platform sits between credentialled RNs, ENs, AINs,
                carers, and midwives and the facilities that need them.
                No agencies. No phone-tag. Verified credentials, real
                rates, and shifts that actually fit the way the people
                doing this work live.
              </p>
            </div>
          </div>

          <!-- Stat row — four numbers separated by vertical mist
               dividers on sm+. Visually anchors the section as the
               "by the numbers" capstone. -->
          <ul
            class="mt-16 grid grid-cols-2 gap-y-10 sm:mt-20 sm:grid-cols-4 sm:divide-x sm:divide-mist sm:gap-y-0"
          >
            <li
              v-for="stat in aboutStats"
              :key="stat.label"
              class="flex flex-col px-2 sm:px-6"
            >
              <p
                class="font-serif text-[40px] font-semibold leading-none tabular-nums text-ink sm:text-[48px] lg:text-[56px]"
              >
                {{ stat.value }}
              </p>
              <p class="mt-3 text-[12px] leading-relaxed text-ink/55 sm:text-[13px]">
                {{ stat.label }}
              </p>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Contact — two-column on lg+: form left, Sydney map right. The
         section flips to a thank-you state for 5 seconds after submit,
         then resets. No real network call — this is a prototype. -->
    <section
      id="contact"
      class="relative overflow-hidden border-t border-mist bg-cream px-6 py-20 sm:px-10 sm:py-24 lg:px-16 lg:py-28"
    >
      <!-- Soft graphic backdrop — sage halo top-right, marigold halo
           bottom-left. Mirrors the About section's gradient mesh
           pattern but flipped so the page has rhythm. -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_85%_15%,rgba(184,201,168,0.45),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(240,187,55,0.25),transparent_50%)]"
      />

      <div class="relative mx-auto max-w-7xl">
        <!-- Header -->
        <div class="mx-auto max-w-2xl text-center">
          <span
            class="inline-flex items-center gap-2 rounded-full border border-forest-deep/15 bg-forest-deep/[0.04] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-forest-deep"
          >
            Get in touch
          </span>
          <h2
            class="mt-6 font-serif text-[34px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[44px] lg:text-[52px]"
          >
            Tell us what you're
            <span class="text-marigold">building.</span>
          </h2>
          <p
            class="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink/65 sm:text-[17px]"
          >
            Facility looking for cover? Professional with feedback?
            Drop us a line — we read every message.
          </p>
        </div>

        <!-- Two-column body — form left, map + contact details right.
             Min-height keeps the form column from collapsing during
             the thank-you transition. -->
        <div
          class="mt-14 grid gap-6 sm:mt-16 lg:grid-cols-2 lg:gap-10"
        >
          <!-- Form column. Sits in its own bone card so it reads as a
               distinct surface against the cream + radial backdrop.
               The form swaps to a thank-you panel via a Transition. -->
          <div
            class="relative overflow-hidden rounded-3xl border border-mist bg-bone p-7 sm:p-10"
          >
            <Transition
              enter-active-class="transition-all duration-500 ease-out"
              enter-from-class="opacity-0 translate-y-3"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-300 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
              mode="out-in"
            >
              <!-- Thank-you panel — visible while contactSubmitted is
                   true (5 seconds). -->
              <div
                v-if="contactSubmitted"
                key="thanks"
                class="flex min-h-[420px] flex-col items-center justify-center text-center"
              >
                <span
                  class="flex h-20 w-20 items-center justify-center rounded-full border border-forest-deep/15 bg-forest-deep/[0.06] text-forest-deep"
                >
                  <CheckCircle2 class="h-10 w-10" />
                </span>
                <h3
                  class="mt-6 font-serif text-[28px] font-semibold tracking-tight text-ink sm:text-[32px]"
                >
                  Thanks — message received.
                </h3>
                <p class="mt-3 max-w-sm text-[14px] leading-relaxed text-ink/65 sm:text-[15px]">
                  We'll be in touch within one business day. This form
                  will reset shortly.
                </p>
              </div>

              <!-- Form panel -->
              <form
                v-else
                key="form"
                novalidate
                class="space-y-5"
                @submit.prevent="handleContactSubmit"
              >
                <div class="grid gap-5 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="contact-name" class="text-[13px] font-medium text-ink/75">
                      Name
                    </Label>
                    <Input
                      id="contact-name"
                      v-model="contactForm.name"
                      required
                      placeholder="Maya Patel"
                      class="h-11 rounded-xl border-mist bg-cream"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="contact-email" class="text-[13px] font-medium text-ink/75">
                      Email
                    </Label>
                    <Input
                      id="contact-email"
                      v-model="contactForm.email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      class="h-11 rounded-xl border-mist bg-cream"
                    />
                  </div>
                </div>

                <div class="space-y-2">
                  <Label for="contact-message" class="text-[13px] font-medium text-ink/75">
                    Message
                  </Label>
                  <Textarea
                    id="contact-message"
                    v-model="contactForm.message"
                    required
                    rows="6"
                    placeholder="Tell us what you're working on..."
                    class="rounded-xl border-mist bg-cream"
                  />
                </div>

                <Button
                  type="submit"
                  class="h-11 w-full rounded-full bg-forest-deep text-[14px] font-medium text-cream hover:bg-forest-deep/90 sm:w-auto sm:px-7"
                >
                  Send message
                  <Send class="ml-1.5 h-4 w-4" />
                </Button>
              </form>
            </Transition>
          </div>

          <!-- Map + contact details column -->
          <div class="flex flex-col gap-6">
            <!-- Map. min-h ensures the Leaflet container has dimensions
                 before init. Rounded + bordered to read as a card. -->
            <div
              ref="contactMapEl"
              class="relative z-0 min-h-[320px] overflow-hidden rounded-3xl border border-mist bg-mist sm:min-h-[420px] lg:flex-1"
            />

            <!-- Contact details strip — three small chips with icon +
                 label, presented as one bone card so they don't float
                 untethered below the map. -->
            <div
              class="grid gap-4 rounded-3xl border border-mist bg-bone p-6 sm:grid-cols-3 sm:p-7"
            >
              <div class="flex items-start gap-3">
                <span
                  class="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-forest-deep/10 bg-cream text-forest-deep"
                >
                  <MapPin class="h-4 w-4" />
                </span>
                <div class="leading-tight">
                  <p class="text-[10px] font-medium uppercase tracking-[0.18em] text-ink/50">
                    Office
                  </p>
                  <p class="mt-1 text-[14px] font-medium text-ink">
                    Sydney, NSW
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span
                  class="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-forest-deep/10 bg-cream text-forest-deep"
                >
                  <Mail class="h-4 w-4" />
                </span>
                <div class="leading-tight">
                  <p class="text-[10px] font-medium uppercase tracking-[0.18em] text-ink/50">
                    Email
                  </p>
                  <p class="mt-1 text-[14px] font-medium text-ink">
                    hello@shiftlink.au
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span
                  class="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-forest-deep/10 bg-cream text-forest-deep"
                >
                  <Phone class="h-4 w-4" />
                </span>
                <div class="leading-tight">
                  <p class="text-[10px] font-medium uppercase tracking-[0.18em] text-ink/50">
                    Phone
                  </p>
                  <p class="mt-1 text-[14px] font-medium text-ink">
                    +61 2 0000 0000
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer — closing CTA banner + 3-column link spread + copyright
         row. The CTA banner uses the forest-deep card pattern from
         elsewhere in the brand (auth views, hero echoes). The link
         spread sits on cream so it reads as a quiet final breath
         before the copyright bar. -->
    <footer class="bg-cream">
      <!-- CTA banner — forest-deep rounded card with eyebrow,
           headline, and two CTAs. Padded gutter so the rounded corners
           read as a card on the page (matches the auth-view pattern
           we use elsewhere). -->
      <div class="px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div
          class="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-forest-deep px-6 py-10 sm:px-12 sm:py-14 lg:px-16"
        >
          <!-- Decorative dotted texture inside the card so the deep
               forest doesn't read as a flat block. Same pattern as
               the hero for visual continuity. -->
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle,rgba(240,237,227,0.08)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_85%)]"
          />

          <!-- Soft marigold halo bottom-right for warmth -->
          <div
            aria-hidden="true"
            class="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-marigold/15 blur-3xl"
          />

          <div
            class="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10"
          >
            <div class="max-w-xl">
              <span
                class="inline-flex items-center gap-2 rounded-full border border-cream/20 bg-cream/[0.06] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-cream/75"
              >
                Ready when you are
              </span>
              <h2
                class="mt-5 font-serif text-[28px] font-semibold leading-[1.1] tracking-tight text-cream sm:text-[36px] lg:text-[44px]"
              >
                Ready to staff your shifts
                <span class="text-marigold">the modern way?</span>
              </h2>
            </div>

            <div class="flex flex-wrap gap-3">
              <Button
                as-child
                class="h-11 rounded-full bg-marigold px-6 text-[14px] font-medium text-ink hover:bg-marigold/90"
              >
                <RouterLink to="/staff/registration">
                  Post a shift
                  <ArrowRight class="ml-1.5 h-4 w-4" />
                </RouterLink>
              </Button>
              <Button
                as-child
                variant="outline"
                class="h-11 rounded-full border-cream/40 bg-transparent px-6 text-[14px] text-cream hover:bg-cream/10 hover:text-cream"
              >
                <RouterLink to="/register">
                  Sign up as professional
                </RouterLink>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Link spread + brand row -->
      <div class="px-6 pb-10 pt-16 sm:px-10 sm:pt-20 lg:px-16">
        <div class="mx-auto max-w-7xl">
          <!-- 4-col spread on lg+: brand block + 3 link columns -->
          <div class="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            <!-- Brand block -->
            <div>
              <RouterLink
                to="/"
                class="font-serif text-[24px] font-semibold tracking-tight text-ink"
              >
                ShiftLink
              </RouterLink>
              <p class="mt-4 max-w-xs text-[14px] leading-relaxed text-ink/60">
                Healthcare shift coverage, designed in Sydney. Built for
                the people doing the work.
              </p>
              <!-- Social row -->
              <ul class="mt-6 flex items-center gap-2">
                <li v-for="social in [
                  { icon: Linkedin, label: 'LinkedIn' },
                  { icon: Instagram, label: 'Instagram' },
                  { icon: Facebook, label: 'Facebook' },
                  { icon: Twitter, label: 'Twitter' },
                ]" :key="social.label">
                  <a
                    href="#"
                    :aria-label="social.label"
                    class="flex h-9 w-9 items-center justify-center rounded-full border border-mist bg-bone text-ink/65 transition-colors hover:border-forest-deep/30 hover:bg-forest-deep hover:text-cream"
                  >
                    <component :is="social.icon" class="h-4 w-4" />
                  </a>
                </li>
              </ul>
            </div>

            <!-- Product column -->
            <div>
              <p
                class="text-[11px] font-medium uppercase tracking-[0.22em] text-ink/50"
              >
                Product
              </p>
              <ul class="mt-5 space-y-3 text-[14px] text-ink/75">
                <li>
                  <RouterLink to="/shifts" class="transition-colors hover:text-forest-deep">
                    Browse shifts
                  </RouterLink>
                </li>
                <li>
                  <RouterLink to="/register" class="transition-colors hover:text-forest-deep">
                    For professionals
                  </RouterLink>
                </li>
                <li>
                  <RouterLink to="/staff/registration" class="transition-colors hover:text-forest-deep">
                    For facilities
                  </RouterLink>
                </li>
                <li>
                  <RouterLink to="/login" class="transition-colors hover:text-forest-deep">
                    Sign in
                  </RouterLink>
                </li>
              </ul>
            </div>

            <!-- Company column -->
            <div>
              <p
                class="text-[11px] font-medium uppercase tracking-[0.22em] text-ink/50"
              >
                Company
              </p>
              <ul class="mt-5 space-y-3 text-[14px] text-ink/75">
                <li>
                  <a href="#about" class="transition-colors hover:text-forest-deep">
                    About
                  </a>
                </li>
                <li>
                  <a href="#testimonials" class="transition-colors hover:text-forest-deep">
                    Testimonials
                  </a>
                </li>
                <li>
                  <a href="#contact" class="transition-colors hover:text-forest-deep">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" class="transition-colors hover:text-forest-deep">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            <!-- Resources column -->
            <div>
              <p
                class="text-[11px] font-medium uppercase tracking-[0.22em] text-ink/50"
              >
                Resources
              </p>
              <ul class="mt-5 space-y-3 text-[14px] text-ink/75">
                <li>
                  <a href="#" class="transition-colors hover:text-forest-deep">
                    Help centre
                  </a>
                </li>
                <li>
                  <a href="#" class="transition-colors hover:text-forest-deep">
                    Credentialling guide
                  </a>
                </li>
                <li>
                  <a href="#" class="transition-colors hover:text-forest-deep">
                    For nurses (FAQ)
                  </a>
                </li>
                <li>
                  <a href="#" class="transition-colors hover:text-forest-deep">
                    For facilities (FAQ)
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Copyright row — divided by hairline mist, balances brand
           credit on the left with legal links on the right. -->
      <div class="border-t border-mist px-6 py-6 sm:px-10 lg:px-16">
        <div
          class="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 text-[12px] text-ink/55 sm:flex-row sm:items-center"
        >
          <p>© 2026 ShiftLink. Built in Sydney for Sydney.</p>
          <ul class="flex flex-wrap items-center gap-x-6 gap-y-2">
            <li>
              <a href="#" class="transition-colors hover:text-forest-deep">
                Privacy
              </a>
            </li>
            <li>
              <a href="#" class="transition-colors hover:text-forest-deep">
                Terms of Use
              </a>
            </li>
            <li>
              <a href="#" class="transition-colors hover:text-forest-deep">
                Security
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  </main>
</template>
