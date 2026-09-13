<script setup lang="ts">
import { menu } from '#shared/content'
import type { MenuCourse, RoomChoice, RoomNight } from '#shared/content'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Edit party — Wedding HQ', robots: 'noindex' })

interface AdminGuest {
  id: number
  name: string
  isChild: boolean
  phone: string | null
  attending: boolean | null
  starterChoiceId: string | null
  mainChoiceId: string | null
  dessertChoiceId: string | null
  dietaryNotes: string | null
}

interface AdminRoom {
  night: RoomNight
  choice: RoomChoice
  shareWith: string | null
  occupants: number
}

interface AdminParty {
  id: number
  name: string
  token: string
  respondedAt: string | null
  songRequest: string | null
  noteToCouple: string | null
  phone: string | null
  guests: AdminGuest[]
  rooms: AdminRoom[]
  amountPaid: number
  roomTotal: number
}

const route = useRoute()
const partyId = Number(route.params.id)

const { data, refresh } = await useFetch<{ parties: AdminParty[] }>('/api/admin/parties')
const party = computed(() => data.value?.parties.find(entry => entry.id === partyId))

const error = ref('')
const notice = ref('')

// --- party details (name, guests, phones, child flags) ---
interface GuestRow { id?: number, name: string, isChild: boolean, phone: string }
const name = ref('')
const guestRows = ref<GuestRow[]>([])

// --- RSVP answers ---
interface AnswerRow {
  id: number
  name: string
  isChild: boolean
  attending: '' | 'yes' | 'no'
  starterChoiceId: string
  mainChoiceId: string
  dessertChoiceId: string
  dietaryNotes: string
}
const answers = ref<AnswerRow[]>([])
const phone = ref('')
const song = ref('')
const note = ref('')
const roomRows = ref<AdminRoom[]>([])
const amountPaid = ref(0)

function load() {
  const current = party.value
  if (!current) return
  name.value = current.name
  guestRows.value = current.guests.map(guest => ({
    id: guest.id,
    name: guest.name,
    isChild: guest.isChild,
    phone: guest.phone ?? '',
  }))
  answers.value = current.guests.map(guest => ({
    id: guest.id,
    name: guest.name,
    isChild: guest.isChild,
    attending: guest.attending === null ? '' : guest.attending ? 'yes' : 'no',
    starterChoiceId: guest.starterChoiceId ?? '',
    mainChoiceId: guest.mainChoiceId ?? '',
    dessertChoiceId: guest.dessertChoiceId ?? '',
    dietaryNotes: guest.dietaryNotes ?? '',
  }))
  phone.value = current.phone ?? ''
  song.value = current.songRequest ?? ''
  note.value = current.noteToCouple ?? ''
  roomRows.value = current.rooms.map(room => ({ ...room, shareWith: room.shareWith ?? '' }))
  amountPaid.value = current.amountPaid ?? 0
}
watch(party, load, { immediate: true })

const courseField = (course: MenuCourse) => COURSE_FIELDS[course.id]
const mealsFor = (course: MenuCourse, row: AnswerRow) => optionsFor(course, row.isChild)

const addRoom = () => roomRows.value.push({ night: 'of', choice: 'our_room', shareWith: '', occupants: 1 })
const removeRoom = (index: number) => roomRows.value.splice(index, 1)
const liveRoomTotal = computed(() => roomTotal(roomRows.value))

// typed-route inference overflows (TS2321) on dynamic URLs now the API has grown; erase it here
const rawFetch = $fetch as (url: string, opts?: { method?: string, body?: unknown }) => Promise<unknown>

async function call(action: () => Promise<unknown>, done: string) {
  error.value = ''
  notice.value = ''
  try {
    await action()
    await refresh()
    notice.value = done
  }
  catch (err) {
    error.value = (err as { data?: { message?: string } }).data?.message ?? 'Something went wrong.'
  }
}

function addGuest() {
  guestRows.value.push({ name: '', isChild: false, phone: '' })
}

function removeGuest(index: number) {
  const row = guestRows.value[index]!
  if (row.id && !confirm(`Remove ${row.name || 'this guest'} from the party?`)) return
  guestRows.value.splice(index, 1)
}

const saveDetails = () => call(() => rawFetch(`/api/admin/parties/${partyId}`, {
  method: 'PATCH',
  body: {
    name: name.value,
    guests: guestRows.value.map(row => ({
      id: row.id,
      name: row.name,
      isChild: row.isChild,
      phone: row.phone || undefined,
    })),
  },
}), 'Party details saved.')

const saveAnswers = async () => {
  await call(() => rawFetch(`/api/admin/parties/${partyId}/rsvp`, {
    method: 'PUT',
    body: {
      phone: phone.value || undefined,
      songRequest: song.value || undefined,
      noteToCouple: note.value || undefined,
      guests: answers.value
        .filter(row => row.attending !== '')
        .map(row => ({
          id: row.id,
          attending: row.attending === 'yes',
        })),
      rooms: roomRows.value.map(room => ({
        night: room.night,
        choice: room.choice,
        shareWith: room.choice === 'share_named' ? room.shareWith : null,
        occupants: room.occupants,
      })),
    },
  }), 'RSVP answers saved.')
  if (!error.value) {
    await call(() => rawFetch(`/api/admin/parties/${partyId}`, {
      method: 'PATCH',
      body: { amountPaid: Number(amountPaid.value) || 0 },
    }), 'RSVP answers saved.')
  }
}

// meals live behind the food-choice page and save separately, matching the two guest pages
const saveFoodAnswers = () => call(() => rawFetch(`/api/admin/parties/${partyId}/food`, {
  method: 'PUT',
  body: {
    guests: answers.value
      .filter(row => row.attending === 'yes')
      .map(row => ({
        id: row.id,
        ...Object.fromEntries(menu.courses.map(course => [courseField(course), row[courseField(course)]])),
        dietaryNotes: row.dietaryNotes || undefined,
      })),
  },
}), 'Food answers saved.')

const regenerateToken = () => {
  if (!confirm('Regenerate the token? The old RSVP link and QR code will stop working.')) return
  return call(() => rawFetch(`/api/admin/parties/${partyId}/token`, { method: 'POST' }), 'New RSVP link generated.')
}

async function deleteParty() {
  if (!confirm(`Delete ${party.value?.name} and all their guests? This cannot be undone.`)) return
  await call(() => rawFetch(`/api/admin/parties/${partyId}`, { method: 'DELETE' }), '')
  await navigateTo('/admin')
}

const rsvpLink = computed(() => {
  const origin = import.meta.client ? window.location.origin : ''
  return party.value ? `${origin}/?t=${party.value.token}` : ''
})

async function copyLink() {
  await navigator.clipboard.writeText(rsvpLink.value)
  notice.value = 'Link copied.'
}

const fieldClass = 'rounded-lg border border-leaf/40 bg-white/70 px-3 py-1.5 text-ink'
</script>

<template>
  <section v-if="party" class="max-w-2xl">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="font-display text-3xl text-ink">{{ party.name }}</h1>
      <span class="rounded-full px-2 py-0.5 text-xs" :class="party.respondedAt ? 'bg-leaf/20 text-leaf-deep' : 'bg-petal/20 text-petal-deep'">
        {{ party.respondedAt ? 'Responded' : 'No reply yet' }}
      </span>
    </div>

    <p v-if="notice" class="mt-3 rounded-lg bg-leaf/15 px-3 py-2 text-sm text-leaf-deep" role="status">{{ notice }}</p>
    <p v-if="error" class="mt-3 rounded-lg bg-petal/15 px-3 py-2 text-sm text-petal-deep" role="alert">{{ error }}</p>

    <!-- details -->
    <form class="mt-6 flex flex-col gap-3 rounded-xl border border-ink/10 bg-white/70 p-4" @submit.prevent="saveDetails">
      <h2 class="font-display text-xl text-ink">Details</h2>
      <label class="flex flex-col gap-1 text-sm text-leaf-deep">
        Party name
        <input v-model="name" name="name" required :class="fieldClass">
      </label>
      <div v-for="(row, index) in guestRows" :key="row.id ?? `new-${index}`" class="flex flex-wrap items-center gap-2">
        <input v-model="row.name" required placeholder="Guest name" class="min-w-40 grow" :class="fieldClass">
        <input v-model="row.phone" type="tel" placeholder="Phone (optional)" class="w-44" :class="fieldClass">
        <label class="flex items-center gap-1 text-sm text-ink">
          <input v-model="row.isChild" type="checkbox"> Child
        </label>
        <button type="button" class="text-sm text-petal-deep" @click="removeGuest(index)">Remove</button>
      </div>
      <button type="button" class="self-start text-sm text-leaf-deep underline" @click="addGuest">+ Add guest</button>
      <button type="submit" class="self-start rounded-full bg-leaf-deep px-5 py-2 text-cream hover:bg-leaf">Save details</button>
    </form>

    <!-- RSVP answers: admin edits bypass the deadline lock -->
    <form class="mt-6 flex flex-col gap-3 rounded-xl border border-ink/10 bg-white/70 p-4" @submit.prevent="saveAnswers">
      <h2 class="font-display text-xl text-ink">RSVP answers</h2>
      <div v-for="row in answers" :key="row.id" class="rounded-lg border border-ink/10 p-3">
        <p class="font-semibold text-ink">{{ row.name }}</p>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <select v-model="row.attending" :name="`attending-${row.id}`" :class="fieldClass">
            <option value="">No answer</option>
            <option value="yes">Attending</option>
            <option value="no">Declined</option>
          </select>
        </div>
      </div>

      <h3 class="font-display text-lg text-ink">Rooms</h3>
      <div v-for="(room, index) in roomRows" :key="index" class="flex flex-wrap items-center gap-2">
        <select v-model="room.night" :name="`room-${index}-night`" :class="fieldClass">
          <option v-for="night in ROOM_NIGHTS" :key="night" :value="night">{{ ROOM_NIGHT_LABELS[night] }}</option>
        </select>
        <select v-model="room.choice" :name="`room-${index}-choice`" :class="fieldClass">
          <option v-for="choice in ROOM_CHOICES" :key="choice" :value="choice">{{ ROOM_CHOICE_LABELS[choice] }}</option>
        </select>
        <select v-if="room.choice === 'our_room'" v-model.number="room.occupants" :name="`room-${index}-occupants`" :class="fieldClass">
          <option :value="1">1 guest</option>
          <option :value="2">2 guests</option>
        </select>
        <input
          v-if="room.choice === 'share_named'"
          v-model="room.shareWith"
          :name="`room-${index}-share`"
          placeholder="Sharing with"
          class="min-w-40 grow"
          :class="fieldClass"
        >
        <span class="text-sm text-ink/60">£{{ roomPrice(room.night, room.choice, room.occupants) }}</span>
        <button type="button" class="text-sm text-petal-deep" @click="removeRoom(index)">Remove</button>
      </div>
      <button type="button" class="self-start text-sm text-leaf-deep underline" @click="addRoom">+ Add room</button>
      <label class="flex flex-col gap-1 text-sm text-leaf-deep">
        Amount paid (owes £{{ liveRoomTotal }})
        <input v-model.number="amountPaid" name="amountPaid" type="number" min="0" step="1" class="w-40" :class="fieldClass">
      </label>
      <label class="flex flex-col gap-1 text-sm text-leaf-deep">
        Contact phone
        <input v-model="phone" name="phone" type="tel" :class="fieldClass">
      </label>
      <label class="flex flex-col gap-1 text-sm text-leaf-deep">
        Song request
        <input v-model="song" name="song" :class="fieldClass">
      </label>
      <label class="flex flex-col gap-1 text-sm text-leaf-deep">
        Note to couple
        <textarea v-model="note" name="note" rows="2" :class="fieldClass" />
      </label>
      <button type="submit" class="self-start rounded-full bg-leaf-deep px-5 py-2 text-cream hover:bg-leaf">Save answers</button>
    </form>

    <!-- food answers: edited separately, matching the guest-facing menu page -->
    <form class="mt-6 flex flex-col gap-3 rounded-xl border border-ink/10 bg-white/70 p-4" @submit.prevent="saveFoodAnswers">
      <h2 class="font-display text-xl text-ink">Food answers</h2>
      <p v-if="!answers.some(row => row.attending === 'yes')" class="text-sm text-ink/60">
        No attending guests yet — meals are only asked of guests who are coming.
      </p>
      <template v-for="row in answers" :key="row.id">
        <div v-if="row.attending === 'yes'" class="rounded-lg border border-ink/10 p-3">
          <p class="font-semibold text-ink">{{ row.name }}</p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <select
              v-for="course in menu.courses"
              :key="course.id"
              v-model="row[courseField(course)]"
              :name="`meal-${course.id}-${row.id}`"
              required
              :class="fieldClass"
            >
              <option value="" disabled>Choose a {{ course.name.toLowerCase() }}</option>
              <option v-for="option in mealsFor(course, row)" :key="option.id" :value="option.id">{{ option.name }}</option>
            </select>
            <input
              v-model="row.dietaryNotes"
              :name="`dietary-${row.id}`"
              placeholder="Dietary notes"
              class="min-w-40 grow"
              :class="fieldClass"
            >
          </div>
        </div>
      </template>
      <button type="submit" class="self-start rounded-full bg-leaf-deep px-5 py-2 text-cream hover:bg-leaf">Save food answers</button>
    </form>

    <!-- link & danger zone -->
    <div class="mt-6 flex flex-col gap-3 rounded-xl border border-ink/10 bg-white/70 p-4">
      <h2 class="font-display text-xl text-ink">RSVP link</h2>
      <p class="break-all text-sm text-ink/60">{{ rsvpLink }}</p>
      <div class="flex flex-wrap gap-3">
        <button type="button" class="rounded-full border border-leaf/40 px-4 py-1.5 text-sm text-leaf-deep hover:border-petal" @click="copyLink">Copy link</button>
        <button type="button" class="rounded-full border border-leaf/40 px-4 py-1.5 text-sm text-leaf-deep hover:border-petal" @click="regenerateToken">Regenerate token</button>
        <button type="button" class="ms-auto rounded-full border border-petal/50 px-4 py-1.5 text-sm text-petal-deep hover:bg-petal/10" @click="deleteParty">Delete party</button>
      </div>
    </div>
  </section>
  <section v-else>
    <p class="text-ink/60">Party not found. <NuxtLink to="/admin" class="underline">Back to dashboard</NuxtLink></p>
  </section>
</template>
