<script setup lang="ts">
/**
 * Professional registration form — presentational only.
 *
 * Two grouped sections (about you, credentials). All state and submit logic
 * lives in `useProfessionalRegistrationForm`, which calls into the pure
 * service. Mirrors `StaffRegistrationForm.vue` so the audiences feel like a
 * matching set; differences are field-level (role enum, years experience)
 * rather than structural.
 */
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Lock, UserCircle2 } from 'lucide-vue-next'
import { Role, ROLE_LABELS } from '@/modules/professional/enums/Role'
import { useProfessionalRegistrationForm } from '../composables/useProfessionalRegistrationForm'

const { values, errors, status, submit } = useProfessionalRegistrationForm()

const roleOptions = Object.values(Role)
</script>

<template>
  <form class="space-y-12" @submit.prevent="submit">
    <!-- Form-level error banner -->
    <p
      v-if="errors.form"
      class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
      <span>{{ errors.form }}</span>
    </p>

    <!-- Section 1: About you -->
    <fieldset class="space-y-6">
      <legend
        class="mb-2 flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-ink"
      >
        <UserCircle2 class="h-4 w-4 text-ink/55" />
        About you
      </legend>

      <div class="space-y-2">
        <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="pro-name">
          Full name
        </Label>
        <Input
          id="pro-name"
          v-model="values.name"
          type="text"
          autocomplete="name"
          placeholder="e.g. Alex Martinez"
          maxlength="80"
          class="h-12 rounded-xl border-mist bg-bone text-[15px]"
        />
        <p v-if="errors.name" class="flex items-center gap-1.5 text-[12px] text-destructive">
          <AlertCircle class="h-3 w-3" />
          {{ errors.name }}
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="pro-email">
            Email
          </Label>
          <Input
            id="pro-email"
            v-model="values.email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            maxlength="120"
            class="h-12 rounded-xl border-mist bg-bone text-[15px]"
          />
          <p v-if="errors.email" class="flex items-center gap-1.5 text-[12px] text-destructive">
            <AlertCircle class="h-3 w-3" />
            {{ errors.email }}
          </p>
        </div>

        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="pro-phone">
            Phone
            <span class="ml-1 normal-case tracking-normal text-ink/40">(optional)</span>
          </Label>
          <Input
            id="pro-phone"
            v-model="values.phone"
            type="tel"
            autocomplete="tel"
            placeholder="04xx xxx xxx"
            maxlength="32"
            class="h-12 rounded-xl border-mist bg-bone text-[15px]"
          />
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="pro-role">
            Your role
          </Label>
          <Select v-model="values.role">
            <SelectTrigger
              id="pro-role"
              class="h-12 w-full rounded-xl border-mist bg-bone text-[15px]"
            >
              <SelectValue placeholder="Pick a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in roleOptions" :key="option" :value="option">
                {{ ROLE_LABELS[option] }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="errors.role" class="flex items-center gap-1.5 text-[12px] text-destructive">
            <AlertCircle class="h-3 w-3" />
            {{ errors.role }}
          </p>
        </div>

        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="pro-years">
            Years of experience
          </Label>
          <Input
            id="pro-years"
            v-model="values.yearsExperience"
            type="number"
            inputmode="numeric"
            :min="0"
            :max="60"
            placeholder="e.g. 5"
            class="h-12 rounded-xl border-mist bg-bone text-[15px]"
          />
          <p
            v-if="errors.yearsExperience"
            class="flex items-center gap-1.5 text-[12px] text-destructive"
          >
            <AlertCircle class="h-3 w-3" />
            {{ errors.yearsExperience }}
          </p>
        </div>
      </div>
    </fieldset>

    <!-- Section 2: Credentials -->
    <fieldset class="space-y-6">
      <legend
        class="mb-2 flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-ink"
      >
        <Lock class="h-4 w-4 text-ink/55" />
        Pick a password
      </legend>

      <div class="grid gap-6 md:grid-cols-2">
        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="pro-password">
            Password
          </Label>
          <Input
            id="pro-password"
            v-model="values.password"
            type="password"
            autocomplete="new-password"
            placeholder="At least 6 characters"
            class="h-12 rounded-xl border-mist bg-bone text-[15px]"
          />
          <p
            v-if="errors.password"
            class="flex items-center gap-1.5 text-[12px] text-destructive"
          >
            <AlertCircle class="h-3 w-3" />
            {{ errors.password }}
          </p>
        </div>

        <div class="space-y-2">
          <Label
            class="text-[11px] uppercase tracking-[0.18em] text-ink/55"
            for="pro-confirm-password"
          >
            Confirm password
          </Label>
          <Input
            id="pro-confirm-password"
            v-model="values.confirmPassword"
            type="password"
            autocomplete="new-password"
            placeholder="Re-enter your password"
            class="h-12 rounded-xl border-mist bg-bone text-[15px]"
          />
          <p
            v-if="errors.confirmPassword"
            class="flex items-center gap-1.5 text-[12px] text-destructive"
          >
            <AlertCircle class="h-3 w-3" />
            {{ errors.confirmPassword }}
          </p>
        </div>
      </div>
      <p class="text-[12px] text-ink/45">
        This is a prototype — passwords are not stored or checked. Pick anything 6+ characters.
      </p>
    </fieldset>

    <!-- Actions -->
    <div class="border-t border-mist pt-6">
      <Button
        type="submit"
        :disabled="status === 'submitting'"
        class="h-12 w-full rounded-full bg-marigold text-[15px] font-medium text-ink hover:bg-marigold/90"
      >
        {{ status === 'submitting' ? 'Creating account…' : 'Create my account' }}
      </Button>
    </div>
  </form>
</template>
