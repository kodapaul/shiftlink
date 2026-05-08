import { createRouter, createWebHistory } from 'vue-router'
import { UserType } from '@/modules/user/enums/UserType'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // Real landing page is the last build phase (per docu/TODOS.md).
      // For now, route the root straight into the facility portal demo.
      path: '/',
      redirect: '/facility',
    },
    {
      path: '/facility',
      component: () => import('@/modules/facility/views/FacilityLayoutView.vue'),
      meta: { requiresUserType: UserType.FacilityStaff },
      children: [
        {
          path: '',
          name: 'facility-dashboard',
          component: () =>
            import('@/modules/facility/views/FacilityDashboardView.vue'),
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
  ],
})

router.beforeEach((to) => {
  const required = (to.meta.requiresUserType as UserType | undefined) ?? null
  if (!required) return true

  const auth = useAuthStore()

  // Prototype convenience: if no one's logged in and the route requires a
  // specific user type, auto-impersonate the demo account for that type so
  // the dashboard isn't blocked by a not-yet-built signup flow.
  if (!auth.isAuthenticated) {
    if (required === UserType.FacilityStaff) auth.loginAsFacility()
    else auth.loginAsProfessional()
    return true
  }

  if (auth.userType !== required) {
    return auth.userType === UserType.FacilityStaff ? '/facility' : '/'
  }

  return true
})

export default router
