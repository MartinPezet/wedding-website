<script setup lang="ts">
import type { RoomNight } from '#shared/content'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Rooms — Wedding HQ', robots: 'noindex' })

interface RoomingRoom {
  night: RoomNight
  kind: 'own' | 'named_share' | 'paired' | 'awaiting_partner'
  requestIds: number[]
  occupants: string[]
  parties: string[]
}

const KIND_LABELS: Record<Exclude<RoomingRoom['kind'], 'awaiting_partner'>, string> = {
  own: 'Own room',
  named_share: 'Named share',
  paired: 'Matched share',
}

const { data, refresh } = await useFetch<{ rooms: RoomingRoom[] }>('/api/admin/rooms')

const nights = computed(() => ROOM_NIGHTS.map((night) => {
  const rooms = (data.value?.rooms ?? []).filter(room => room.night === night)
  return {
    night,
    label: ROOM_NIGHT_LABELS[night],
    rooms: rooms.filter(room => room.kind !== 'awaiting_partner'),
    awaiting: rooms.filter(room => room.kind === 'awaiting_partner'),
  }
}))

// two awaiting requests on the same night make a pair
const selected = ref<{ id: number, night: RoomNight }[]>([])
const isSelected = (id: number) => selected.value.some(entry => entry.id === id)
const canSelect = (room: RoomingRoom) =>
  isSelected(room.requestIds[0]!)
  || (selected.value.length < 2 && selected.value.every(entry => entry.night === room.night))

function toggle(room: RoomingRoom) {
  const id = room.requestIds[0]!
  selected.value = isSelected(id)
    ? selected.value.filter(entry => entry.id !== id)
    : [...selected.value, { id, night: room.night }]
}

const error = ref('')
async function send(body: { pair: number[] } | { unpair: number }) {
  error.value = ''
  try {
    await $fetch('/api/admin/rooms/pair', { method: 'POST', body })
    selected.value = []
    await refresh()
  }
  catch (caught) {
    error.value = (caught as { data?: { message?: string } }).data?.message ?? 'Could not update the pairing.'
  }
}
</script>

<template>
  <section>
    <h1 class="font-display text-3xl text-ink">Rooms</h1>
    <p class="mt-1 text-sm text-ink/70">Pair "match us with another guest" requests by hand. The venue pack includes this rooming list.</p>
    <p v-if="error" class="mt-3 rounded-lg bg-petal/20 px-3 py-2 text-sm text-petal-deep" role="alert">{{ error }}</p>

    <div v-for="entry in nights" :key="entry.night" class="mt-6" :data-night="entry.night">
      <h2 class="font-display text-xl text-ink">{{ entry.label }}</h2>

      <div v-if="entry.awaiting.length" class="mt-2 rounded-xl border border-petal/40 bg-white/70 p-3">
        <div class="flex flex-wrap items-center gap-3">
          <p class="text-xs uppercase tracking-widest text-petal-deep">Awaiting a partner</p>
          <button
            v-if="selected.length === 2 && selected[0]!.night === entry.night"
            type="button"
            class="ms-auto rounded-full bg-leaf-deep px-4 py-1 text-sm text-cream hover:bg-leaf"
            @click="send({ pair: selected.map(item => item.id) })"
          >
            Pair selected
          </button>
        </div>
        <ul class="mt-2 space-y-1 text-sm">
          <li v-for="room in entry.awaiting" :key="room.requestIds[0]" data-awaiting-partner>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                :checked="isSelected(room.requestIds[0]!)"
                :disabled="!canSelect(room)"
                @change="toggle(room)"
              >
              <span class="text-ink">{{ room.occupants.join(', ') }}</span>
              <span class="text-ink/60">· {{ room.parties.join(', ') }}</span>
            </label>
          </li>
        </ul>
      </div>

      <ul class="mt-2 flex flex-col gap-2">
        <li v-for="room in entry.rooms" :key="room.requestIds.join('-')" class="flex flex-wrap items-center gap-2 rounded-xl border border-ink/10 bg-white/70 p-3 text-sm" data-room>
          <span class="rounded-full bg-leaf/20 px-2 py-0.5 text-xs text-leaf-deep">{{ KIND_LABELS[room.kind as keyof typeof KIND_LABELS] }}</span>
          <span class="font-semibold text-ink">{{ room.occupants.join(' & ') }}</span>
          <span class="text-ink/60">{{ room.parties.join(', ') }}</span>
          <button
            v-if="room.kind === 'paired'"
            type="button"
            class="ms-auto text-petal-deep hover:text-petal"
            @click="send({ unpair: room.requestIds[0]! })"
          >
            Unpair
          </button>
        </li>
      </ul>
      <p v-if="!entry.rooms.length && !entry.awaiting.length" class="mt-2 text-sm text-ink/60">No rooms booked for this night.</p>
    </div>
  </section>
</template>
