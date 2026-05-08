<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { type DateValue, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { Input } from '@/components/ui/input'
import { Urgency } from '@/modules/shifts/enums'
import { usePostShiftForm } from '../composables/usePostShiftForm'
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  DollarSign,
  AlertCircle,
} from 'lucide-vue-next'
import TimePicker from '@/components/TimePicker.vue'

const props = defineProps<{
  /** Pass an existing shift id to put the form in edit mode. */
  editingShiftId?: string
}>()

const router = useRouter()
const { values, errors, status, isEditMode, submit } = usePostShiftForm({
  editingShiftId: props.editingShiftId,
})

const todaysDate = today(getLocalTimeZone())

// Bridge between the form's `values.date` (YYYY-MM-DD string, used by the
// service / shifts store) and the calendar's `DateValue` (CalendarDate from
// @internationalized/date). The calendar component can't bind directly to a
// plain string.
const calendarDate = computed<DateValue | undefined>({
  get: () => (values.date ? parseDate(values.date) : undefined),
  set: (next) => {
    if (!next) {
      values.date = ''
      return
    }
    values.date = next.toString() // formats as YYYY-MM-DD
  },
})

const formattedDate = computed(() =>
  values.date
    ? new Date(values.date + 'T00:00:00').toLocaleDateString('en-AU', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null,
)

function onSubmit() {
  const created = submit()
  if (created) router.push('/facility')
}

const hasErrors = computed(() => Object.keys(errors.value).length > 0)
</script>

<template>
  <form class="space-y-10" @submit.prevent="onSubmit">
    <!-- Role -->
    <fieldset>
      <div class="space-y-2">
        <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="role">
          Role required
        </Label>
        <Input
          id="role"
          v-model="values.role"
          type="text"
          placeholder="e.g. Registered Nurse — Acute Care"
          maxlength="80"
          class="h-12 rounded-xl border-mist bg-bone text-[15px]"
        />
        <p class="text-[12px] text-ink/45">
          A specific title helps the right professionals find your shift.
        </p>
        <p v-if="errors.role" class="flex items-center gap-1.5 text-[12px] text-destructive">
          <AlertCircle class="h-3 w-3" />
          {{ errors.role }}
        </p>
      </div>
    </fieldset>

    <!-- Location -->
    <fieldset>
      <div class="space-y-2">
        <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="location">
          Location
          <span class="ml-1 normal-case tracking-normal text-ink/40">(optional)</span>
        </Label>
        <Input
          id="location"
          v-model="values.location"
          type="text"
          placeholder="e.g. ICU, Building B · Acute Ward, Level 3"
          maxlength="120"
          class="h-12 rounded-xl border-mist bg-bone text-[15px]"
        />
        <p class="text-[12px] text-ink/45">
          Where exactly should they show up? Skip if your facility has a single site.
        </p>
      </div>
    </fieldset>
    <!-- Date + times -->
    <fieldset>
      <legend
        class="mb-4 flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-ink"
      >
        <CalendarDays class="h-4 w-4 text-ink/55" />
        When
      </legend>
      <div class="grid gap-6 md:grid-cols-3">
        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="date">
            Date
          </Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                id="date"
                type="button"
                variant="outline"
                :class="[
                  'h-12 w-full justify-start rounded-xl border-mist bg-bone px-4 text-[15px] font-normal hover:bg-bone',
                  !values.date && 'text-ink/45',
                ]"
              >
                <CalendarIcon class="mr-2 h-4 w-4 text-ink/55" />
                {{ formattedDate ?? 'Pick a date' }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto rounded-xl border-mist bg-bone p-0" align="start">
              <Calendar
                v-model="calendarDate"
                :min-value="todaysDate"
                :is-date-unavailable="(d: DateValue) => d.compare(todaysDate) < 0"
                initial-focus
              />
            </PopoverContent>
          </Popover>
          <p v-if="errors.date" class="flex items-center gap-1.5 text-[12px] text-destructive">
            <AlertCircle class="h-3 w-3" />
            {{ errors.date }}
          </p>
        </div>

        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="startTime">
            Start
          </Label>
          <TimePicker
            v-model="values.startTime"
            trigger-id="startTime"
            placeholder="Start time"
          />
          <p v-if="errors.startTime" class="flex items-center gap-1.5 text-[12px] text-destructive">
            <AlertCircle class="h-3 w-3" />
            {{ errors.startTime }}
          </p>
        </div>

        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="endTime">
            End
          </Label>
          <TimePicker
            v-model="values.endTime"
            trigger-id="endTime"
            placeholder="End time"
          />
          <p v-if="errors.endTime" class="flex items-center gap-1.5 text-[12px] text-destructive">
            <AlertCircle class="h-3 w-3" />
            {{ errors.endTime }}
          </p>
        </div>
      </div>
    </fieldset>

    <!-- Rate + urgency -->
    <fieldset>
      <legend
        class="mb-4 flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-ink"
      >
        <DollarSign class="h-4 w-4 text-ink/55" />
        Pay
      </legend>
      <div class="grid gap-6 md:grid-cols-2">
        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55" for="rate">
            Hourly rate (AUD)
          </Label>
          <div class="relative">
            <span
              class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-serif text-[18px] text-ink/55"
            >
              $
            </span>
            <Input
              id="rate"
              v-model="values.hourlyRate"
              type="number"
              inputmode="decimal"
              :min="0"
              step="0.5"
              placeholder="68"
              class="h-12 rounded-xl border-mist bg-bone pl-9 text-[15px]"
            />
            <span
              class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] uppercase tracking-[0.14em] text-ink/45"
            >
              / hr
            </span>
          </div>
          <p
            v-if="errors.hourlyRate"
            class="flex items-center gap-1.5 text-[12px] text-destructive"
          >
            <AlertCircle class="h-3 w-3" />
            {{ errors.hourlyRate }}
          </p>
        </div>

        <div class="space-y-2">
          <Label class="text-[11px] uppercase tracking-[0.18em] text-ink/55">Urgency</Label>
          <div class="flex gap-2">
            <button
              type="button"
              :class="[
                'flex-1 cursor-pointer rounded-xl border px-4 py-3 text-left text-[14px] transition-colors',
                values.urgency === Urgency.Standard
                  ? 'border-ink bg-ink text-cream'
                  : 'border-mist bg-bone text-ink/70 hover:border-ink/30 hover:text-ink',
              ]"
              @click="values.urgency = Urgency.Standard"
            >
              <span class="block text-[11px] uppercase tracking-[0.16em]">Standard</span>
              <span class="mt-1 block text-[12px] opacity-75">Posted now</span>
            </button>
            <button
              type="button"
              :class="[
                'flex-1 cursor-pointer rounded-xl border px-4 py-3 text-left text-[14px] transition-colors',
                values.urgency === Urgency.Urgent
                  ? 'border-blush bg-blush text-ink'
                  : 'border-mist bg-bone text-ink/70 hover:border-blush/60 hover:text-ink',
              ]"
              @click="values.urgency = Urgency.Urgent"
            >
              <span class="block text-[11px] uppercase tracking-[0.16em]">Urgent</span>
              <span class="mt-1 block text-[12px] opacity-75">Surfaces sooner</span>
            </button>
          </div>
        </div>
      </div>
    </fieldset>

    <!-- Notes -->
    <fieldset>
      <legend
        class="mb-4 flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-ink"
      >
        <Clock class="h-4 w-4 text-ink/55" />
        Notes
        <span class="text-[12px] font-sans font-normal text-ink/45">(optional)</span>
      </legend>
      <RichTextEditor
        v-model="values.notes"
        placeholder="Anything the professional should know. Special requirements, parking, handover details."
      />
    </fieldset>

    <!-- Actions -->
    <div
      class="flex flex-col-reverse gap-3 border-t border-mist pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <Button
        type="button"
        variant="ghost"
        class="text-ink/70 hover:bg-ink/5 hover:text-ink"
        @click="router.push('/facility')"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        :disabled="status === 'submitting'"
        class="h-12 rounded-full bg-marigold px-7 text-[15px] font-medium text-ink hover:bg-marigold/90"
      >
        <template v-if="isEditMode">
          {{ status === 'submitting' ? 'Saving…' : 'Save changes' }}
        </template>
        <template v-else>
          {{ status === 'submitting' ? 'Posting…' : 'Post shift' }}
        </template>
      </Button>
    </div>

    <p v-if="hasErrors && status === 'error'" class="text-center text-[13px] text-destructive">
      Please fix the highlighted fields above.
    </p>
  </form>
</template>
