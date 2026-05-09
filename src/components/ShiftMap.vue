<script setup lang="ts">
/**
 * ShiftMap — reusable Leaflet map that pins a list of shifts.
 *
 * Each shift with `lat`/`lng` becomes a pin. Pins are colored by status +
 * urgency (sage = open, blush = urgent, mist on ink = claimed).
 *
 * Tile provider: CartoDB Voyager — free, no API key, soft warm aesthetic
 * that fits the eucalyptus cream/forest palette.
 *
 * Default center / zoom is Sydney metro since that's where the seed data
 * lives. Override via props if needed.
 */

import { onBeforeUnmount, onMounted, ref, watch, computed } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Shift } from '@/modules/shifts/types'
import { ShiftStatus, Urgency } from '@/modules/shifts/enums'
import { formatTime12h, formatRate, formatShiftDate } from '@/helpers/format'

interface Props {
  shifts: Shift[]
  /** Initial center [lat, lng]. Defaults to Sydney CBD. */
  center?: [number, number]
  /** Initial zoom. Defaults to 11 (whole metro area visible). */
  zoom?: number
  /**
   * When set (and the shift has lat/lng), the map flies to that shift's
   * marker and opens its popup. Two-way pattern: parent sets this when the
   * user clicks a list item; the map emits `select` when the user clicks a
   * pin so the parent can update its highlighted item.
   */
  selectedId?: string | null
  /** Zoom level used when flying to a selected shift. */
  selectedZoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  center: () => [-33.8688, 151.2093],
  zoom: 11,
  selectedId: null,
  selectedZoom: 15,
})

const emit = defineEmits<{ (e: 'select', shiftId: string): void }>()

const container = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let markersLayer: L.LayerGroup | null = null
/** Track markers by shift id so we can fly + open popup on selection. */
const markersById = new Map<string, L.Marker>()

// Pins are pure HTML/CSS so they pick up brand tokens. Each pin is a small
// dot inside a soft circle, color-coded by shift status + urgency.
function makeIcon(shift: Shift): L.DivIcon {
  const isUrgent = shift.urgency === Urgency.Urgent
  const isClaimed = shift.status === ShiftStatus.Claimed

  let bg = 'var(--sage)'
  let dot = 'var(--forest)'
  if (isClaimed) {
    bg = 'var(--mist)'
    dot = 'var(--ink)'
  } else if (isUrgent) {
    bg = 'var(--blush)'
    dot = 'var(--ink)'
  }

  return L.divIcon({
    html: `
      <span style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 9999px;
        background: ${bg};
        border: 2px solid var(--bone);
        box-shadow: 0 1px 3px rgb(0 0 0 / 0.18);
      ">
        <span style="
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: ${dot};
        "></span>
      </span>
    `,
    className: 'shiftlink-pin',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  })
}

function popupHtml(shift: Shift): string {
  const date = formatShiftDate(shift.date)
  const times = `${formatTime12h(shift.startTime)} – ${formatTime12h(shift.endTime)}`
  const rate = formatRate(shift.hourlyRate)
  const statusLabel = shift.status === ShiftStatus.Claimed ? 'Claimed' : shift.urgency === Urgency.Urgent ? 'Urgent' : 'Open'

  return `
    <div style="font-family: 'Inter', sans-serif; min-width: 200px;">
      <p style="margin: 0 0 4px; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(26,26,26,0.55);">
        ${statusLabel}
      </p>
      <h3 style="margin: 0 0 8px; font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; line-height: 1.2; color: #1a1a1a;">
        ${escapeHtml(shift.role)}
      </h3>
      <p style="margin: 0 0 2px; font-size: 13px; color: rgba(26,26,26,0.85);">
        ${escapeHtml(date)} · ${escapeHtml(times)}
      </p>
      <p style="margin: 0; font-size: 13px; font-weight: 500; color: #1a1a1a;">
        ${escapeHtml(rate)}
      </p>
      ${shift.location
        ? `<p style="margin: 8px 0 0; font-size: 12px; color: rgba(26,26,26,0.65);">📍 ${escapeHtml(shift.location)}</p>`
        : ''}
    </div>
  `
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
}

// `Number.isFinite` (not just `!= null`) so `NaN` lat/lng — which can sneak
// in through stale localStorage or hand-edited seed data — gets filtered
// out. Without this guard, NaN coords pass the null check, get a marker,
// and crash `flyTo` with "Invalid LatLng object: (NaN, NaN)".
const pinnableShifts = computed(() =>
  props.shifts.filter(
    (s) => Number.isFinite(s.lat) && Number.isFinite(s.lng),
  ),
)

function renderPins() {
  if (!map || !markersLayer) return
  markersLayer.clearLayers()
  markersById.clear()
  pinnableShifts.value.forEach((shift) => {
    const marker = L.marker([shift.lat!, shift.lng!], { icon: makeIcon(shift) })
    marker.bindPopup(popupHtml(shift), { closeButton: true, autoClose: true })
    marker.on('click', () => emit('select', shift.id))
    marker.addTo(markersLayer!)
    markersById.set(shift.id, marker)
  })
}

function focusSelected(id: string | null | undefined) {
  if (!id || !map) return
  const marker = markersById.get(id)
  if (!marker) return
  // Defensive: if the marker somehow has NaN/Inf coords (stale localStorage,
  // hand-edited seed, etc.), `flyTo` throws. Skip silently — the row in the
  // list is still selectable, we just can't pin it on the map.
  const ll = marker.getLatLng()
  if (!Number.isFinite(ll.lat) || !Number.isFinite(ll.lng)) return
  map.flyTo(ll, props.selectedZoom, { animate: true, duration: 0.7 })
  // Wait for the fly animation, then open the popup so it lands centered.
  marker.openPopup()
}

onMounted(() => {
  if (!container.value) return

  map = L.map(container.value, {
    center: props.center,
    zoom: props.zoom,
    zoomControl: true,
    scrollWheelZoom: true,
  })

  // CartoDB Voyager — soft warm tiles that play nicely with cream/forest.
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    },
  ).addTo(map)

  markersLayer = L.layerGroup().addTo(map)
  renderPins()
})

watch(
  () => props.shifts,
  () => {
    renderPins()
    // After a re-render of pins (e.g. filter changed), respect the selection.
    focusSelected(props.selectedId)
  },
  { deep: true },
)

watch(
  () => props.selectedId,
  (id) => focusSelected(id),
)

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
    markersLayer = null
  }
})
</script>

<template>
  <div class="relative h-full w-full overflow-hidden rounded-2xl border border-mist bg-bone">
    <div ref="container" class="h-full w-full" />
    <p
      v-if="pinnableShifts.length === 0"
      class="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-sm text-ink/55"
    >
      No shifts with coordinates to show.
    </p>
  </div>
</template>

<style>
/* Override Leaflet's default popup chrome to match the cream/bone aesthetic.
 * These styles are global on purpose — Leaflet renders popups outside any
 * Vue scope. */
.leaflet-popup-content-wrapper {
  border-radius: 14px;
  background: var(--bone);
  color: var(--ink);
  box-shadow: 0 4px 20px rgb(0 0 0 / 0.08);
  border: 1px solid var(--mist);
}
.leaflet-popup-tip {
  background: var(--bone);
  border: 1px solid var(--mist);
}
.leaflet-popup-content {
  margin: 14px 16px;
}
.leaflet-container {
  font-family: 'Inter', sans-serif;
  background: var(--bone);
}
.shiftlink-pin {
  background: transparent;
  border: 0;
}
</style>
