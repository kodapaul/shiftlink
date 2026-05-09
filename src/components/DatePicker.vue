<script setup lang="ts">
/**
 * DatePicker — calendar-popover date input wrapped around shadcn-vue's
 * Calendar + Popover + Button primitives.
 *
 * Public API mirrors a plain `<input type="date">`: `v-model` is a
 * `YYYY-MM-DD` string (empty string means no date selected). This keeps
 * the form layer simple — services and validation continue to work with
 * plain ISO date strings; the bridge to `@internationalized/date`'s
 * `DateValue` lives only inside this component.
 *
 * Why not the native date picker?
 *   - Inconsistent across browsers / OSes
 *   - Doesn't pick up brand tokens (we want cream + mist + Fraunces)
 *   - Trigger button gives us full control over display formatting
 *
 * Defaults the trigger surface to `bg-cream` (suits the edit-form context
 * where the field sits inside a bone card). Consumers can override via the
 * `class` prop when needed.
 */

import { computed, type HTMLAttributes } from 'vue'
import { type DateValue, parseDate } from '@internationalized/date'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  /** YYYY-MM-DD string. Empty string means no date picked. */
  modelValue: string
  id?: string
  placeholder?: string
  /** YYYY-MM-DD min date allowed (inclusive). Optional. */
  minDate?: string
  /** YYYY-MM-DD max date allowed (inclusive). Optional. */
  maxDate?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pick a date',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// `parseDate` throws on invalid strings; wrap in try/catch so a stray
// non-ISO value (from old localStorage, hand edits, etc.) doesn't crash
// the popover. The form layer's validation handles the user-facing
// "looks invalid" error if needed.
function safeParse(iso: string | undefined): DateValue | undefined {
  if (!iso) return undefined
  try {
    return parseDate(iso)
  } catch {
    return undefined
  }
}

const calendarDate = computed<DateValue | undefined>({
  get: () => safeParse(props.modelValue),
  set: (next) => {
    emit('update:modelValue', next ? next.toString() : '')
  },
})

const minValue = computed<DateValue | undefined>(() => safeParse(props.minDate))
const maxValue = computed<DateValue | undefined>(() => safeParse(props.maxDate))

/** "Thu 14 May 2026" — what the trigger button displays when a date is set. */
const formattedDate = computed<string | null>(() =>
  props.modelValue
    ? new Date(props.modelValue + 'T00:00:00').toLocaleDateString('en-AU', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null,
)
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        :id="id"
        type="button"
        variant="outline"
        :class="
          cn(
            'h-12 w-full justify-start rounded-xl border-mist bg-cream px-4 text-[15px] font-normal hover:bg-cream/80',
            !modelValue && 'text-ink/45',
            props.class,
          )
        "
      >
        <CalendarIcon class="mr-2 h-4 w-4 text-ink/55" />
        {{ formattedDate ?? placeholder }}
      </Button>
    </PopoverTrigger>
    <PopoverContent
      class="w-auto rounded-xl border-mist bg-bone p-0"
      align="start"
    >
      <Calendar
        v-model="calendarDate"
        :min-value="minValue"
        :max-value="maxValue"
        initial-focus
      />
    </PopoverContent>
  </Popover>
</template>
