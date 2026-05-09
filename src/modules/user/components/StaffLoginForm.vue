<script setup lang="ts">
/**
 * Staff login form — presentational only.
 *
 * Owns the template + bindings; all state and submit logic lives in the
 * `useStaffLoginForm` composable, which in turn calls into the pure service.
 */
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-vue-next'
import { useStaffLoginForm } from '../composables/useStaffLoginForm'

const { values, errors, status, submit } = useStaffLoginForm()
</script>

<template>
  <form class="space-y-7" @submit.prevent="submit">
    <!-- Form-level error banner -->
    <p
      v-if="errors.form"
      class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
      <span>{{ errors.form }}</span>
    </p>

    <!-- Email -->
    <div class="space-y-2">
      <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="email">
        Work email
      </Label>
      <Input
        id="email"
        v-model="values.email"
        type="email"
        autocomplete="email"
        placeholder="you@yourfacility.org.au"
        class="h-12 rounded-xl border-mist bg-bone text-[15px]"
      />
      <p v-if="errors.email" class="flex items-center gap-1.5 text-[12px] text-destructive">
        <AlertCircle class="h-3 w-3" />
        {{ errors.email }}
      </p>
    </div>

    <!-- Password -->
    <div class="space-y-2">
      <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="password">
        Password
      </Label>
      <Input
        id="password"
        v-model="values.password"
        type="password"
        autocomplete="current-password"
        placeholder="At least 6 characters"
        class="h-12 rounded-xl border-mist bg-bone text-[15px]"
      />
      <p v-if="errors.password" class="flex items-center gap-1.5 text-[12px] text-destructive">
        <AlertCircle class="h-3 w-3" />
        {{ errors.password }}
      </p>
    </div>

    <Button
      type="submit"
      :disabled="status === 'submitting'"
      class="h-12 w-full rounded-full bg-marigold text-[15px] font-medium text-ink hover:bg-marigold/90"
    >
      {{ status === 'submitting' ? 'Signing in…' : 'Sign in' }}
    </Button>
  </form>
</template>
