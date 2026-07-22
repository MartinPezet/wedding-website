<script setup lang="ts">
import { menu } from '#shared/content'
import type { TableShape } from '#shared/utils/seating'
import { CANVAS, ROUND_TABLE_RADIUS, SEAT_RADIUS, rectSize, seatPositions } from '#shared/utils/seating'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Seating — Wedding HQ', robots: 'noindex' })

const editor = useSeatingEditor()
await editor.load()
const { tables, guests, unassigned, warnings, saveError } = editor

// flush any pending autosave before leaving the page
onBeforeUnmount(() => { void editor.flush() })

const isOverCapacity = (tableId: number) => warnings.value.overCapacity.some(table => table.id === tableId)

// party-grouped sidebar, attending only
const partyGroups = computed(() => {
  const groups = new Map<string, typeof guests.value>()
  for (const guest of guests.value) {
    if (!guest.attending) continue
    const group = groups.get(guest.partyName) ?? []
    group.push(guest)
    groups.set(guest.partyName, group)
  }
  return [...groups.entries()].map(([partyName, members]) => ({ partyName, members }))
})

const mealNames = new Map(menu.courses.flatMap(course =>
  [...course.options, ...(course.childOptions ?? [])].map(option => [option.id, option.name])))
const mainName = (guest: { mainChoiceId: string | null }) =>
  guest.mainChoiceId ? mealNames.get(guest.mainChoiceId) : undefined
const mealTitle = (guest: { starterChoiceId: string | null, mainChoiceId: string | null, dessertChoiceId: string | null }) =>
  [guest.starterChoiceId, guest.mainChoiceId, guest.dessertChoiceId]
    .map(id => id && mealNames.get(id)).filter(Boolean).join(' · ')

// --- canvas coordinate mapping -------------------------------------------
const svgRef = ref<SVGSVGElement>()

function toCanvas(event: PointerEvent) {
  const rect = svgRef.value!.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * CANVAS.width,
    y: ((event.clientY - rect.top) / rect.height) * CANVAS.height,
  }
}

// --- table selection + drag ----------------------------------------------
const selectedId = ref<number | null>(null)
const selected = computed(() => tables.value.find(table => table.id === selectedId.value) ?? null)

interface TableDrag { tableId: number, offsetX: number, offsetY: number }
let tableDrag: TableDrag | null = null

function onTableDown(event: PointerEvent, tableId: number) {
  selectedId.value = tableId
  const table = tables.value.find(t => t.id === tableId)!
  const point = toCanvas(event)
  tableDrag = { tableId, offsetX: point.x - table.x, offsetY: point.y - table.y }
  window.addEventListener('pointermove', onTableMove)
  window.addEventListener('pointerup', onTableUp)
}

function onTableMove(event: PointerEvent) {
  if (!tableDrag) return
  const point = toCanvas(event)
  editor.moveTable(
    tableDrag.tableId,
    Math.min(Math.max(point.x - tableDrag.offsetX, 40), CANVAS.width - 40),
    Math.min(Math.max(point.y - tableDrag.offsetY, 40), CANVAS.height - 40),
  )
}

function onTableUp() {
  tableDrag = null
  window.removeEventListener('pointermove', onTableMove)
  window.removeEventListener('pointerup', onTableUp)
}

// --- guest drag (sidebar chip or occupied seat) ---------------------------
const guestDrag = ref<{ guestId: number, name: string, x: number, y: number } | null>(null)

function startGuestDrag(event: PointerEvent, guestId: number, name: string) {
  event.preventDefault()
  guestDrag.value = { guestId, name, x: event.clientX, y: event.clientY }
  window.addEventListener('pointermove', onGuestMove)
  window.addEventListener('pointerup', onGuestUp)
}

function onGuestMove(event: PointerEvent) {
  if (!guestDrag.value) return
  guestDrag.value.x = event.clientX
  guestDrag.value.y = event.clientY
}

function onGuestUp(event: PointerEvent) {
  const drag = guestDrag.value
  guestDrag.value = null
  window.removeEventListener('pointermove', onGuestMove)
  window.removeEventListener('pointerup', onGuestUp)
  if (!drag) return
  // touch pointers implicitly capture the origin element, so resolve the
  // drop target from the pointer position instead of event.target
  const target = document.elementFromPoint(event.clientX, event.clientY)
  if (!target) return
  const seat = target.closest('[data-drop-table]')
  if (seat) {
    editor.assignGuest(drag.guestId, Number(seat.getAttribute('data-drop-table')), Number(seat.getAttribute('data-drop-seat')))
    return
  }
  if (target.closest('[data-testid="seating-sidebar"]')) editor.unassignGuest(drag.guestId)
}

// --- table controls --------------------------------------------------------
async function addTable(shape: TableShape) {
  const row = await editor.addTable(shape)
  selectedId.value = row.id
}

function deleteSelected() {
  if (!selected.value) return
  if (!confirm(`Delete ${selected.value.name}? Its guests return to the sidebar.`)) return
  editor.removeTable(selected.value.id)
  selectedId.value = null
}

// guard edits client-side: one bad field would 400 the whole autosave batch
function renameSelected() {
  if (!selected.value) return
  const name = selected.value.name.trim()
  if (name) editor.updateTable(selected.value.id, { name })
}

function resizeSelected(event: Event) {
  if (!selected.value) return
  const capacity = Number((event.target as HTMLInputElement).value)
  if (Number.isInteger(capacity) && capacity >= 1 && capacity <= 24) {
    editor.updateTable(selected.value.id, { capacity })
  }
}

const firstName = (name: string) => name.split(' ')[0]!

const fieldClass = 'rounded-lg border border-leaf/40 bg-white/70 px-3 py-1.5 text-ink'
</script>

<template>
  <section>
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <h1 class="font-display text-3xl text-ink">Seating</h1>
      <span data-testid="unassigned-count" class="rounded-full bg-petal/20 px-2 py-0.5 text-xs text-petal-deep">
        {{ unassigned.length }} unseated
      </span>
      <div class="ms-auto flex items-center gap-2 text-sm">
        <button type="button" :class="fieldClass" class="hover:border-petal" @click="addTable('round')">+ Round table</button>
        <button type="button" :class="fieldClass" class="hover:border-petal" @click="addTable('rect')">+ Long table</button>
      </div>
    </div>

    <div v-if="selected" class="mb-3 flex flex-wrap items-center gap-2 text-sm">
      <input
        v-model="selected.name"
        name="tableName"
        :class="fieldClass"
        class="w-40"
        @change="renameSelected"
      >
      <select
:value="selected.shape" name="tableShape" :class="fieldClass"
              @change="editor.updateTable(selected!.id, { shape: ($event.target as HTMLSelectElement).value as TableShape })">
        <option value="round">Round</option>
        <option value="rect">Long</option>
      </select>
      <label class="flex items-center gap-1 text-leaf-deep">
        Seats
        <input
          :value="selected.capacity"
          name="tableCapacity"
          type="number"
          min="1"
          max="24"
          :class="fieldClass"
          class="w-18"
          @change="resizeSelected"
        >
      </label>
      <button type="button" class="text-petal-deep hover:text-petal" @click="deleteSelected">Delete table</button>
    </div>

    <p v-if="saveError" class="mb-3 rounded-lg bg-petal/20 px-3 py-2 text-sm text-petal-deep">{{ saveError }}</p>

    <div
      v-if="warnings.unseated.length || warnings.orphans.length || warnings.overCapacity.length"
      data-testid="seating-warnings"
      class="mb-3 space-y-1 rounded-lg border border-petal/40 bg-petal/10 px-3 py-2 text-sm text-ink"
    >
      <p v-if="warnings.unseated.length">
        {{ warnings.unseated.length }} attending {{ warnings.unseated.length === 1 ? 'guest' : 'guests' }} still unseated:
        {{ warnings.unseated.map(guest => guest.name).join(', ') }}
      </p>
      <p v-for="table in warnings.overCapacity" :key="table.id">
        {{ table.name }} has more guests than seats.
      </p>
      <p v-for="orphan in warnings.orphans" :key="orphan.id" class="flex items-center gap-2">
        <span>{{ orphan.name }} is seated but no longer attending.</span>
        <button
          type="button"
          :data-testid="`remove-orphan-${orphan.id}`"
          class="text-petal-deep underline hover:text-petal"
          @click="editor.unassignGuest(orphan.id)"
        >
          Remove from seat
        </button>
      </p>
    </div>

    <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
      <svg
        ref="svgRef"
        data-testid="seating-canvas"
        :viewBox="`0 0 ${CANVAS.width} ${CANVAS.height}`"
        class="aspect-[10/7] w-full touch-none select-none rounded-xl border border-leaf/30 bg-white/60 lg:flex-1"
        @pointerdown="selectedId = null"
      >
        <g
          v-for="table in tables"
          :key="table.id"
          :data-table-id="table.id"
          :transform="`translate(${table.x}, ${table.y})`"
          class="cursor-move"
          @pointerdown.stop="onTableDown($event, table.id)"
        >
          <circle
            v-if="table.shape === 'round'"
            :r="ROUND_TABLE_RADIUS"
            :class="[table.id === selectedId ? 'stroke-petal-deep' : 'stroke-leaf-deep', isOverCapacity(table.id) ? 'fill-petal/30' : 'fill-cream']"
            stroke-width="2"
          />
          <rect
            v-else
            :x="-rectSize(table.capacity).width / 2"
            :y="-rectSize(table.capacity).height / 2"
            :width="rectSize(table.capacity).width"
            :height="rectSize(table.capacity).height"
            rx="8"
            :class="[table.id === selectedId ? 'stroke-petal-deep' : 'stroke-leaf-deep', isOverCapacity(table.id) ? 'fill-petal/30' : 'fill-cream']"
            stroke-width="2"
          />
          <text text-anchor="middle" dominant-baseline="middle" class="fill-ink font-display" font-size="12">
            {{ table.name }}
          </text>
          <g v-for="(seat, index) in seatPositions(table.shape, table.capacity)" :key="index">
            <circle
              data-seat=""
              :data-drop-table="table.id"
              :data-drop-seat="index"
              :cx="seat.x"
              :cy="seat.y"
              :r="SEAT_RADIUS"
              stroke-width="1.5"
              :class="editor.guestAt(table.id, index)
                ? 'cursor-grab fill-petal/40 stroke-petal-deep'
                : 'fill-white/80 stroke-leaf/60'"
              @pointerdown.stop="editor.guestAt(table.id, index)
                && startGuestDrag($event, editor.guestAt(table.id, index)!.id, editor.guestAt(table.id, index)!.name)"
              @dblclick="editor.guestAt(table.id, index) && editor.unassignGuest(editor.guestAt(table.id, index)!.id)"
            >
              <title v-if="editor.guestAt(table.id, index)">{{ editor.guestAt(table.id, index)!.name }}</title>
            </circle>
            <text
              v-if="editor.guestAt(table.id, index)"
              :x="seat.x"
              :y="seat.y + SEAT_RADIUS + 8"
              text-anchor="middle"
              font-size="8"
              class="pointer-events-none fill-ink/80"
            >
              {{ editor.guestAt(table.id, index)!.name }}
            </text>
          </g>
        </g>
      </svg>

      <aside data-testid="seating-sidebar" class="max-h-[70vh] shrink-0 overflow-y-auto rounded-xl border border-leaf/30 bg-white/60 p-3 lg:sticky lg:top-20 lg:w-72">
        <h2 class="mb-2 text-sm uppercase tracking-widest text-leaf-deep">Guests</h2>
        <p class="mb-3 text-xs text-ink/60">Drag a guest onto a seat. Drop back here to unseat.</p>
        <div v-for="group in partyGroups" :key="group.partyName" class="mb-3">
          <h3 class="mb-1 text-xs font-semibold text-ink/70">{{ group.partyName }}</h3>
          <ul class="space-y-1">
            <li
              v-for="guest in group.members"
              :key="guest.id"
              :data-guest-chip="guest.id"
              :data-assigned="guest.tableId !== null ? 'true' : 'false'"
              :title="mealTitle(guest)"
              class="flex cursor-grab touch-none select-none items-center gap-2 rounded-lg border border-leaf/30 bg-white px-2 py-1 text-sm"
              :class="{ 'opacity-45': guest.tableId !== null }"
              @pointerdown="startGuestDrag($event, guest.id, guest.name)"
            >
              <span class="text-ink">{{ guest.name }}</span>
              <span v-if="guest.isChild" class="text-xs text-leaf-deep">child</span>
              <span v-if="mainName(guest)" class="ms-auto rounded-full bg-leaf/15 px-1.5 py-0.5 text-xs text-leaf-deep">
                {{ mainName(guest) }}
              </span>
              <span v-if="guest.tableId !== null" class="text-xs text-petal-deep">✓</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <div
      v-if="guestDrag"
      class="pointer-events-none fixed z-50 rounded-full bg-petal-deep px-3 py-1 text-sm text-white shadow-lg"
      :style="{ left: `${guestDrag.x + 10}px`, top: `${guestDrag.y + 10}px` }"
    >
      {{ firstName(guestDrag.name) }}
    </div>
  </section>
</template>
