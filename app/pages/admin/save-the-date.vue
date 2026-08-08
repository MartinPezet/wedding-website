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

const { data } = await useFetch<{ responses: Response[] }>('/api/admin/save-the-date')

const responses = computed(() => data.value?.responses ?? [])

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

    <p v-if="!responses.length" class="mt-8 rounded-2xl border border-ink/10 bg-white/60 px-5 py-8 text-center text-leaf-deep">
      No save-the-date responses yet.
    </p>

    <ul v-else class="mt-8 space-y-3">
      <li
        v-for="response in responses"
        :key="response.id"
        class="rounded-2xl border border-ink/10 bg-white/70 px-5 py-4"
      >
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
      </li>
    </ul>
  </section>
</template>
