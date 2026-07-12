<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Dashboard — Wedding HQ', robots: 'noindex' })

interface AdminGuest {
  id: number
  name: string
  isChild: boolean
  phone: string | null
  attending: boolean | null
  mealChoiceId: string | null
  dietaryNotes: string | null
}

interface AdminParty {
  id: number
  name: string
  token: string
  respondedAt: string | null
  phone: string | null
  guests: AdminGuest[]
}

const { data: stats } = await useFetch('/api/admin/stats')
const { data: partyData } = await useFetch<{ parties: AdminParty[] }>('/api/admin/parties')

const filter = ref<'all' | 'responded' | 'outstanding' | 'declined'>('all')

const allDeclined = (party: AdminParty) =>
  party.guests.length > 0 && party.guests.every(guest => guest.attending === false)

const filtered = computed(() => {
  const parties = partyData.value?.parties ?? []
  switch (filter.value) {
    case 'responded': return parties.filter(party => party.respondedAt)
    case 'outstanding': return parties.filter(party => !party.respondedAt)
    case 'declined': return parties.filter(party => party.respondedAt && allDeclined(party))
    default: return parties
  }
})

const rsvpLink = (party: AdminParty) => {
  const origin = import.meta.client ? window.location.origin : ''
  return `${origin}/?t=${party.token}`
}

const copied = ref(0)
async function copyLink(party: AdminParty) {
  await navigator.clipboard.writeText(rsvpLink(party))
  copied.value = party.id
  setTimeout(() => { copied.value = 0 }, 1500)
}

const statCards = computed(() => [
  { label: 'Invited', value: stats.value?.invited ?? 0 },
  { label: 'Responded', value: stats.value?.responded ?? 0 },
  { label: 'Outstanding', value: stats.value?.outstanding ?? 0 },
  { label: 'Attending', value: stats.value?.attending ?? 0 },
  { label: 'Declined', value: stats.value?.declined ?? 0 },
])
</script>

<template>
  <section>
    <h1 class="font-display text-3xl text-ink">Dashboard</h1>

    <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
      <div v-for="card in statCards" :key="card.label" class="rounded-xl border border-ink/10 bg-white/70 p-3 text-center">
        <p class="text-2xl font-semibold text-ink">{{ card.value }}</p>
        <p class="text-xs uppercase tracking-widest text-leaf-deep">{{ card.label }}</p>
      </div>
    </div>

    <h2 class="mt-6 font-display text-xl text-ink">Meal totals</h2>
    <div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3" data-testid="meal-totals">
      <div v-for="mealCourse in stats?.mealTotals ?? []" :key="mealCourse.id" class="rounded-lg border border-ink/10 bg-white/70 p-3">
        <p class="text-xs uppercase tracking-widest text-leaf-deep">{{ mealCourse.name }}</p>
        <ul class="mt-2 space-y-1 text-sm">
          <li v-for="option in mealCourse.options" :key="option.id" class="flex justify-between gap-2">
            <span class="text-ink">{{ option.name }}</span>
            <span class="font-semibold text-petal-deep">{{ option.count }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="mt-8 flex flex-wrap items-center gap-3">
      <h2 class="font-display text-xl text-ink">Parties</h2>
      <label class="ms-auto flex items-center gap-2 text-sm text-leaf-deep">
        Show
        <select v-model="filter" name="filter" class="rounded-lg border border-leaf/40 bg-white/70 px-2 py-1 text-ink">
          <option value="all">All</option>
          <option value="responded">Responded</option>
          <option value="outstanding">Not yet responded</option>
          <option value="declined">Declined</option>
        </select>
      </label>
      <NuxtLink to="/admin/parties/new" class="rounded-full bg-leaf-deep px-4 py-1.5 text-sm text-cream hover:bg-leaf">
        Add party
      </NuxtLink>
    </div>

    <div class="mt-3 flex flex-wrap gap-3 text-sm">
      <a href="/api/admin/export/venue" class="rounded-full border border-leaf/40 px-4 py-1.5 text-leaf-deep hover:border-petal" download>
        Venue pack (.xlsx, no phones)
      </a>
      <a href="/api/admin/export/full" class="rounded-full border border-leaf/40 px-4 py-1.5 text-leaf-deep hover:border-petal" download>
        Full guest list (.xlsx)
      </a>
    </div>

    <ul class="mt-3 flex flex-col gap-3" data-testid="party-list">
      <li v-for="party in filtered" :key="party.id" class="rounded-xl border border-ink/10 bg-white/70 p-4">
        <div class="flex flex-wrap items-center gap-2">
          <NuxtLink :to="`/admin/parties/${party.id}`" class="font-semibold text-ink hover:text-petal">{{ party.name }}</NuxtLink>
          <span
            class="rounded-full px-2 py-0.5 text-xs"
            :class="party.respondedAt ? 'bg-leaf/20 text-leaf-deep' : 'bg-petal/20 text-petal-deep'"
          >
            {{ party.respondedAt ? 'Responded' : 'No reply yet' }}
          </span>
        </div>
        <p class="mt-1 text-sm text-ink/70">{{ party.guests.map(guest => guest.name).join(', ') }}</p>
        <div class="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <a v-if="party.phone" :href="`tel:${party.phone}`" class="text-leaf-deep underline">{{ party.phone }}</a>
          <span class="hidden text-ink/40 sm:inline" data-testid="rsvp-link">{{ rsvpLink(party) }}</span>
          <button type="button" class="text-petal-deep hover:text-petal" @click="copyLink(party)">
            {{ copied === party.id ? 'Copied!' : 'Copy RSVP link' }}
          </button>
        </div>
      </li>
    </ul>
    <p v-if="!filtered.length" class="mt-4 text-sm text-ink/60">No parties match this filter.</p>
  </section>
</template>
