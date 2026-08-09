<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Save the date — Wedding HQ', robots: 'noindex' })

interface Response {
  id: number
  name: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  postcode: string
  country: string
  stayNightBefore: boolean
  stayNightOf: boolean
  createdAt: string
  updatedAt: string
}

const { data, refresh } = await useFetch<{ responses: Response[] }>('/api/admin/save-the-date')

const responses = computed(() => data.value?.responses ?? [])

const error = ref('')
const editingId = ref<number | null>(null)
interface EditRow {
  name: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  postcode: string
  country: string
  stayNightBefore: boolean
  stayNightOf: boolean
}
const edit = ref<EditRow | null>(null)

// typed-route inference overflows (TS2321) on dynamic URLs — erase it here, as in the party editor
const rawFetch = $fetch as (url: string, opts?: { method?: string, body?: unknown }) => Promise<unknown>

function startEdit(response: Response) {
  error.value = ''
  editingId.value = response.id
  edit.value = {
    name: response.name,
    phone: response.phone,
    addressLine1: response.addressLine1,
    addressLine2: response.addressLine2 ?? '',
    city: response.city,
    postcode: response.postcode,
    country: response.country,
    stayNightBefore: response.stayNightBefore,
    stayNightOf: response.stayNightOf,
  }
}

function cancelEdit() {
  editingId.value = null
  edit.value = null
}

async function saveEdit(id: number) {
  error.value = ''
  try {
    await rawFetch(`/api/admin/save-the-date/${id}`, { method: 'PUT', body: edit.value })
    await refresh()
    cancelEdit()
  }
  catch (err) {
    error.value = (err as { data?: { message?: string } }).data?.message ?? 'Something went wrong.'
  }
}

async function remove(response: Response) {
  if (!confirm(`Delete the save-the-date response from ${response.name}?`)) return
  await rawFetch(`/api/admin/save-the-date/${response.id}`, { method: 'DELETE' })
  await refresh()
}

// interest, not bookings — the block is negotiated with the venue separately
const totals = computed(() => {
  const list = responses.value
  return [
    { key: 'night-before', label: 'Night before', value: list.filter(one => one.stayNightBefore).length },
    { key: 'night-of', label: 'Night of', value: list.filter(one => one.stayNightOf).length },
    { key: 'either', label: 'Either night', value: list.filter(one => one.stayNightBefore || one.stayNightOf).length },
  ]
})

const addressOf = (response: Response) =>
  [response.addressLine1, response.addressLine2, response.city, response.postcode, response.country]
    .filter(Boolean)
    .join(', ')

const when = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
</script>

<template>
  <section>
    <h1 class="font-display text-3xl text-ink">Save-the-date replies</h1>
    <p class="mt-2 text-sm text-leaf-deep">
      Addresses for posting invitations, and who is interested in a room at the venue.
      Interest only — nothing here is a booking.
    </p>

    <div class="mt-6 grid grid-cols-3 gap-3">
      <div
        v-for="total in totals"
        :key="total.key"
        :data-interest-total="total.key"
        class="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-center"
      >
        <p class="font-display text-2xl text-ink">{{ total.value }}</p>
        <p class="mt-1 text-xs uppercase tracking-widest text-leaf-deep">{{ total.label }}</p>
      </div>
    </div>

    <p v-if="error" class="mt-3 rounded-lg bg-petal/15 px-3 py-2 text-sm text-petal-deep" role="alert">{{ error }}</p>

    <p v-if="!responses.length" class="mt-8 rounded-2xl border border-ink/10 bg-white/60 px-5 py-8 text-center text-leaf-deep">
      No save-the-date responses yet.
    </p>

    <ul v-else class="mt-8 space-y-3">
      <li
        v-for="response in responses"
        :key="response.id"
        class="rounded-2xl border border-ink/10 bg-white/70 px-5 py-4"
      >
        <form v-if="editingId === response.id && edit" class="flex flex-col gap-2" @submit.prevent="saveEdit(response.id)">
          <input v-model="edit.name" name="name" required class="rounded-lg border border-leaf/40 bg-white/70 px-3 py-1.5 text-ink">
          <input v-model="edit.phone" name="phone" type="tel" required class="rounded-lg border border-leaf/40 bg-white/70 px-3 py-1.5 text-ink">
          <input v-model="edit.addressLine1" name="addressLine1" required placeholder="Address line 1" class="rounded-lg border border-leaf/40 bg-white/70 px-3 py-1.5 text-ink">
          <input v-model="edit.addressLine2" name="addressLine2" placeholder="Address line 2" class="rounded-lg border border-leaf/40 bg-white/70 px-3 py-1.5 text-ink">
          <input v-model="edit.city" name="city" required placeholder="Town / city" class="rounded-lg border border-leaf/40 bg-white/70 px-3 py-1.5 text-ink">
          <input v-model="edit.postcode" name="postcode" required placeholder="Postcode" class="rounded-lg border border-leaf/40 bg-white/70 px-3 py-1.5 text-ink">
          <input v-model="edit.country" name="country" required placeholder="Country" class="rounded-lg border border-leaf/40 bg-white/70 px-3 py-1.5 text-ink">
          <div class="flex flex-wrap gap-4 text-sm text-ink">
            <label class="flex items-center gap-1"><input v-model="edit.stayNightBefore" type="checkbox"> Night before</label>
            <label class="flex items-center gap-1"><input v-model="edit.stayNightOf" type="checkbox"> Night of</label>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="rounded-full bg-leaf-deep px-4 py-1.5 text-sm text-cream hover:bg-leaf">Save</button>
            <button type="button" class="text-sm text-leaf-deep underline" @click="cancelEdit">Cancel</button>
          </div>
        </form>
        <template v-else>
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p class="font-display text-lg text-ink">{{ response.name }}</p>
            <a :href="`tel:${response.phone}`" class="text-sm text-leaf-deep hover:text-petal">{{ response.phone }}</a>
            <span class="ms-auto text-xs uppercase tracking-widest text-leaf-deep/70">{{ when(response.createdAt) }}</span>
          </div>
          <p class="mt-1 text-sm text-leaf-deep">{{ addressOf(response) }}</p>
          <p class="mt-2 flex flex-wrap gap-2 text-xs">
            <span
              v-if="response.stayNightBefore"
              class="rounded-full bg-petal/10 px-3 py-1 text-petal-deep"
            >Night before</span>
            <span
              v-if="response.stayNightOf"
              class="rounded-full bg-petal/10 px-3 py-1 text-petal-deep"
            >Night of</span>
            <span
              v-if="!response.stayNightBefore && !response.stayNightOf"
              class="rounded-full bg-ink/5 px-3 py-1 text-leaf-deep"
            >No room needed</span>
          </p>
          <div class="mt-3 flex gap-3 text-sm">
            <button type="button" class="text-leaf-deep underline" @click="startEdit(response)">Edit</button>
            <button type="button" class="text-petal-deep underline" @click="remove(response)">Delete</button>
          </div>
        </template>
      </li>
    </ul>
  </section>
</template>
