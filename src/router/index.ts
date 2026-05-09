import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { UserType } from '@/modules/user/enums/UserType'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // Scroll behavior:
  //   - savedPosition (back/forward nav) → restore that position
  //   - hash navigation (e.g. `/#about`, `/#contact` from the header) →
  //     smooth-scroll to the element with offset for the sticky header.
  //     Wrapped in a Promise with a small delay so navigation from a
  //     different route (e.g. `/shifts` → `/#about`) waits for HomeView
  //     to mount before trying to scroll the target into view.
  //   - everything else → top of the page
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            el: to.hash,
            top: 80,
            behavior: 'smooth',
          })
        }, 350)
      })
    }
    return { top: 0 }
  },
  routes: [
    // Public layout — wraps the marketing pages and the professional home
    // with the shared `PublicHeader`. Auth pages and the facility portal
    // intentionally use their own self-contained layouts and live outside
    // this wrapper.
    {
      path: '/',
      component: () => import('@/layouts/PublicLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: 'about',
          name: 'about',
          component: () => import('@/views/AboutView.vue'),
        },
        {
          path: 'contact',
          name: 'contact',
          component: () => import('@/views/ContactView.vue'),
        },
        // Professional home (`/professional`). Three-tab dashboard: Profile,
        // Applications, Schedule. Phase B will replace the schedule/apps
        // surfaces with browse + claim functionality.
        {
          path: 'professional',
          name: 'professional-home',
          component: () =>
            import('@/modules/professional/views/ProfessionalHomeView.vue'),
          meta: { requiresUserType: UserType.Professional },
        },
        // Profile edit at `/professional/edit` — dedicated edit page, the
        // Profile tab on the dashboard is read-only.
        {
          path: 'professional/edit',
          name: 'professional-profile-edit',
          component: () =>
            import('@/modules/professional/views/ProfessionalProfileEditView.vue'),
          meta: { requiresUserType: UserType.Professional },
        },
        // Shift browse at `/shifts`. Public — anyone (signed-out visitors,
        // facility staff, professionals) can browse open shifts and the
        // map. Only authed professionals can actually apply; that gate
        // lives in `useShiftsBrowse.applyToShift` and is surfaced via the
        // banners inside `ShiftApplyDialog`.
        {
          path: 'shifts',
          name: 'shifts-browse',
          component: () =>
            import('@/modules/shifts/views/ShiftsBrowseView.vue'),
        },
      ],
    },

    // Staff auth routes.
    //
    // `meta.guestOnly` means: if a session is already active, redirect away
    // from this page. The guard sends authed facility staff to /facility,
    // authed professionals to /professional.
    {
      path: '/staff/login',
      name: 'staff-login',
      component: () => import('@/modules/user/views/StaffLoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/staff/registration',
      name: 'staff-registration',
      component: () => import('@/modules/user/views/StaffRegistrationView.vue'),
      meta: { guestOnly: true },
    },
    {
      // Onboarding requires a facility-staff session, but is exempt from the
      // "must have completed onboarding" check (it IS the onboarding flow).
      path: '/staff/onboarding',
      name: 'staff-onboarding',
      component: () => import('@/modules/user/views/StaffOnboardingView.vue'),
      meta: { requiresUserType: UserType.FacilityStaff, allowDuringOnboarding: true },
    },

    // Professional auth routes — the professional side gets the "primary"
    // unprefixed URLs (`/login`, `/register`) since they're the larger
    // audience. Staff auth keeps the `/staff/...` namespace.
    {
      path: '/login',
      name: 'professional-login',
      component: () => import('@/modules/user/views/ProfessionalLoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'professional-registration',
      component: () =>
        import('@/modules/user/views/ProfessionalRegistrationView.vue'),
      meta: { guestOnly: true },
    },

    // Facility portal — protected.
    {
      path: '/facility',
      component: () => import('@/modules/facility/views/FacilityLayoutView.vue'),
      meta: { requiresUserType: UserType.FacilityStaff },
      children: [
        {
          path: '',
          name: 'facility-dashboard',
          component: () => import('@/modules/facility/views/FacilityDashboardView.vue'),
        },
        {
          path: 'shifts/new',
          name: 'facility-post-shift',
          component: () => import('@/modules/facility/views/PostShiftView.vue'),
        },
        {
          path: 'shifts/:id',
          name: 'facility-shift-detail',
          component: () => import('@/modules/facility/views/ShiftDetailView.vue'),
        },
        {
          path: 'shifts/:id/edit',
          name: 'facility-edit-shift',
          component: () => import('@/modules/facility/views/EditShiftView.vue'),
        },
        {
          path: 'map',
          name: 'facility-shift-map',
          component: () => import('@/modules/facility/views/ShiftMapView.vue'),
        },
        {
          path: 'applications',
          name: 'facility-applications',
          component: () => import('@/modules/facility/views/ApplicationsView.vue'),
        },
      ],
    },

    // 404 — explicit /404 path so guards can redirect here, plus catch-all
    // so any unknown URL also lands here.
    {
      path: '/404',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404',
    },
  ],
})

function readMeta(to: RouteLocationNormalized) {
  return {
    guestOnly: to.meta.guestOnly === true,
    required: (to.meta.requiresUserType as UserType | undefined) ?? null,
    allowDuringOnboarding: to.meta.allowDuringOnboarding === true,
  }
}

/** Where this user "belongs" — used for both guest-only redirects and
 *  wrong-audience redirects. Centralised so we change it once when we add
 *  more landing pages. */
function homePathFor(userType: UserType | null): string {
  if (userType === UserType.FacilityStaff) return '/facility'
  if (userType === UserType.Professional) return '/professional'
  return '/'
}

/** Where an unauth visitor should be sent when hitting a protected route
 *  of the given audience. */
function loginPathFor(required: UserType | null): string {
  if (required === UserType.Professional) return '/login'
  return '/staff/login'
}

router.beforeEach((to) => {
  const meta = readMeta(to)
  const auth = useAuthStore()

  // Guest-only routes (login, registration) — bounce out if already signed in.
  if (meta.guestOnly && auth.isAuthenticated) {
    return homePathFor(auth.userType)
  }

  // Facility staff lockdown — staff are scoped to their portal at
  // `/facility/*`. They don't browse the public marketing pages, the
  // professional dashboard, or the shift search. The only allowed escapes
  // are the onboarding wizard (which lives outside `/facility/*` for layout
  // reasons) and the 404 view (errors should render for everyone). All
  // other paths — including `/`, `/about`, `/contact`, `/shifts`,
  // `/professional/*` — redirect them home.
  if (auth.isFacilityStaff) {
    const allowedForStaff =
      to.path === '/facility' ||
      to.path.startsWith('/facility/') ||
      to.path === '/staff/onboarding' ||
      to.path === '/404'
    if (!allowedForStaff) return '/facility'
  }

  // Routes with no audience requirement (public landing, about, contact, 404)
  // — let through.
  if (!meta.required) return true

  // Protected routes need a session.
  if (!auth.isAuthenticated) {
    return loginPathFor(meta.required)
  }

  // Wrong audience for this route — send them to their own home.
  if (auth.userType !== meta.required) {
    return homePathFor(auth.userType)
  }

  // Authed facility staff who haven't finished onboarding get pushed there,
  // unless they're already on it.
  if (
    auth.isFacilityStaff &&
    !auth.hasCompletedOnboarding &&
    !meta.allowDuringOnboarding
  ) {
    return '/staff/onboarding'
  }

  return true
})

export default router
