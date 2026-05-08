<script setup lang="ts">
/**
 * TimePicker — reusable 12-hour time selector with AM/PM.
 *
 * Public model is kept in 24-hour `'HH:mm'` form so service-layer code
 * (validation, date helpers, formatters) doesn't have to know about the
 * picker's display format.
 *
 * Layout: three columns inside a popover —
 *   [ HOUR 1–12 ] [ MIN 00–59 ] [ AM / PM ]
 *
 * Usage:
 *   <TimePicker v-model="values.startTime" />
 *   <TimePicker v-model="x" :minute-step="5" />        // coarser minutes
 *   <TimePicker v-model="x" placeholder="End time" />
 */

import { computed, ref, watch, nextTick, type HTMLAttributes } from 'vue'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Clock } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  /** 24-hour 'HH:mm' string. */
  modelValue?: string
  placeholder?: string
  /** Minute granularity. Defaults to 1 (every minute). */
  minuteStep?: number
  /** Forwarded to the trigger button so labels can `for=""` the field. */
  triggerId?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pick a time',
  minuteStep: 1,
})

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

type Period = 'AM' | 'PM'

// ── Display data ────────────────────────────────────────────────────────────
const hours12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')) // '01'..'12'
const minutes = computed(() => {
  const step = Math.max(1, Math.min(60, props.minuteStep))
  const out: string[] = []
  for (let m = 0; m < 60; m += step) out.push(String(m).padStart(2, '0'))
  return out
})
const periods: Period[] = ['AM', 'PM']

// ── 24h <-> 12h conversion ─────────────────────────────────────────────────
function to12h(hour24: number): { hour12: number; period: Period } {
  if (hour24 === 0) return { hour12: 12, period: 'AM' }
  if (hour24 === 12) return { hour12: 12, period: 'PM' }
  if (hour24 < 12) return { hour12: hour24, period: 'AM' }
  return { hour12: hour24 - 12, period: 'PM' }
}

function to24h(hour12: number, period: Period): number {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12
  return hour12 === 12 ? 12 : hour12 + 12
}

// ── Parts derived from the prop ────────────────────────────────────────────
const parts = computed(() => {
  const v = props.modelValue ?? ''
  if (!v.includes(':')) return null
  const [hStr, mStr] = v.split(':')
  const h24 = Number(hStr)
  const m = Number(mStr)
  if (Number.isNaN(h24) || Number.isNaN(m)) return null
  const { hour12, period } = to12h(h24)
  return {
    hour12: String(hour12).padStart(2, '0'),
    minute: String(m).padStart(2, '0'),
    period,
  }
})

const display = computed(() => {
  if (!parts.value) return null
  return `${parts.value.hour12}:${parts.value.minute} ${parts.value.period}`
})

// ── Setters: each click emits a fully formed 'HH:mm' 24h string ────────────
function emitTime(hour12: number, minute: string, period: Period) {
  const h24 = to24h(hour12, period)
  emit('update:modelValue', `${String(h24).padStart(2, '0')}:${minute}`)
}

function setHour(hourLabel: string) {
  const next = Number(hourLabel)
  const m = parts.value?.minute ?? '00'
  const p = parts.value?.period ?? 'AM'
  emitTime(next, m, p)
}

function setMinute(minute: string) {
  const h = parts.value ? Number(parts.value.hour12) : 12
  const p = parts.value?.period ?? 'AM'
  emitTime(h, minute, p)
}

function setPeriod(period: Period) {
  const h = parts.value ? Number(parts.value.hour12) : 12
  const m = parts.value?.minute ?? '00'
  emitTime(h, m, period)
}

// ── Auto-scroll active items into view on open ─────────────────────────────
const open = ref(false)
const hourCol = ref<HTMLDivElement | null>(null)
const minuteCol = ref<HTMLDivElement | null>(null)

watch(open, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  hourCol.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'center' })
  minuteCol.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'center' })
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        :id="triggerId"
        type="button"
        variant="outline"
        :class="
          cn(
            'h-12 w-full justify-start rounded-xl border-mist bg-bone px-4 text-[15px] font-normal hover:bg-bone',
            !display && 'text-ink/45',
            props.class,
          )
        "
      >
        <Clock class="mr-2 h-4 w-4 text-ink/55" />
        <span class="tabular-nums">{{ display ?? placeholder }}</span>
      </Button>
    </PopoverTrigger>

    <PopoverContent class="w-auto rounded-xl border-mist bg-bone p-0" align="start">
      <div class="flex">
        <!-- Hours 01–12 -->
        <div class="flex w-20 flex-col">
          <p class="px-3 pt-3 pb-2 text-[10px] uppercase tracking-[0.18em] text-ink/45">Hour</p>
          <div ref="hourCol" class="max-h-56 overflow-y-auto px-2 pb-2">
            <button
              v-for="h in hours12"
              :key="h"
              type="button"
              :data-active="parts?.hour12 === h"
              :class="[
                'flex w-full items-center justify-center rounded-lg px-2 py-1.5 text-[13px] tabular-nums transition-colors cursor-pointer',
                parts?.hour12 === h
                  ? 'bg-ink text-cream font-medium'
                  : 'text-ink/75 hover:bg-mist/55',
              ]"
              @click="setHour(h)"
            >
              {{ h }}
            </button>
          </div>
        </div>

        <div class="w-px bg-mist" aria-hidden="true" />

        <!-- Minutes 00–59 -->
        <div class="flex w-20 flex-col">
          <p class="px-3 pt-3 pb-2 text-[10px] uppercase tracking-[0.18em] text-ink/45">Min</p>
          <div ref="minuteCol" class="max-h-56 overflow-y-auto px-2 pb-2">
            <button
              v-for="m in minutes"
              :key="m"
              type="button"
              :data-active="parts?.minute === m"
              :class="[
                'flex w-full items-center justify-center rounded-lg px-2 py-1.5 text-[13px] tabular-nums transition-colors cursor-pointer',
                parts?.minute === m
                  ? 'bg-ink text-cream font-medium'
                  : 'text-ink/75 hover:bg-mist/55',
              ]"
              @click="setMinute(m)"
            >
              {{ m }}
            </button>
          </div>
        </div>

        <div class="w-px bg-mist" aria-hidden="true" />

        <!-- AM / PM -->
        <div class="flex w-16 flex-col">
          <p class="px-3 pt-3 pb-2 text-[10px] uppercase tracking-[0.18em] text-ink/45">Period</p>
          <div class="flex flex-col gap-1 px-2 pb-2">
            <button
              v-for="p in periods"
              :key="p"
              type="button"
              :data-active="parts?.period === p"
              :class="[
                'flex w-full items-center justify-center rounded-lg px-2 py-1.5 text-[13px] tracking-[0.08em] transition-colors cursor-pointer',
                parts?.period === p
                  ? 'bg-ink text-cream font-medium'
                  : 'text-ink/75 hover:bg-mist/55',
              ]"
              @click="setPeriod(p)"
            >
              {{ p }}
            </button>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
