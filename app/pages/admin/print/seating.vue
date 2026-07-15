<script setup lang="ts">
definePageMeta({ layout: 'print' })
useSeoMeta({ title: 'Seating chart — Wedding HQ', robots: 'noindex' })

interface ChartGuest { id: number, name: string, tableId: number | null, seatIndex: number | null }
interface ChartTable { id: number, name: string }

const { data } = await useFetch<{ tables: ChartTable[], guests: ChartGuest[] }>('/api/admin/seating')
const route = useRoute()

// paper size + orientation, switchable via ?size (A2 portrait default)
const sizeOptions = [
  { value: 'a2', label: 'A2 portrait' },
  { value: 'a2-landscape', label: 'A2 landscape' },
  { value: 'a1', label: 'A1 portrait' },
  { value: 'a1-landscape', label: 'A1 landscape' },
] as const
type ChartSize = (typeof sizeOptions)[number]['value']
const size = computed<ChartSize>(() =>
  sizeOptions.some(option => option.value === route.query.size) ? route.query.size as ChartSize : 'a2')

// each table (in editor order) with its seated guests, ordered by seat index
const tables = computed(() => {
  const byTable = new Map<number, ChartGuest[]>()
  for (const guest of data.value?.guests ?? []) {
    if (guest.tableId == null) continue
    const list = byTable.get(guest.tableId) ?? []
    list.push(guest)
    byTable.set(guest.tableId, list)
  }
  return (data.value?.tables ?? []).map(table => ({
    ...table,
    guests: (byTable.get(table.id) ?? []).sort((a, b) => (a.seatIndex ?? 0) - (b.seatIndex ?? 0)),
  }))
})

const couple = 'Ciera & Martin'
</script>

<template>
  <div>
    <nav class="no-print mb-4 flex flex-wrap justify-center gap-2 text-sm">
      <NuxtLink
        v-for="option in sizeOptions"
        :key="option.value"
        :to="{ query: { size: option.value } }"
        class="rounded-full border px-3 py-1"
        :class="size === option.value ? 'border-petal bg-petal/10 text-petal-deep' : 'border-leaf/40 text-leaf-deep hover:border-petal'"
      >
        {{ option.label }}
      </NuxtLink>
    </nav>

    <PrintPage :size="size">
      <template #bleed>
      <!-- corner clusters centred on each corner, rotated to point inward -->
      <FloralCluster class="absolute left-0 top-0 w-[54rem] -translate-x-1/2 -translate-y-1/2 rotate-[135deg] opacity-80" />
      <FloralCluster class="absolute right-0 top-0 w-[54rem] -translate-y-1/2 translate-x-1/2 -rotate-[135deg] opacity-80" />
      <FloralCluster class="absolute bottom-0 left-0 w-[54rem] -translate-x-1/2 translate-y-1/2 rotate-[45deg] opacity-80" />
      <FloralCluster class="absolute bottom-0 right-0 w-[54rem] translate-x-1/2 translate-y-1/2 -rotate-[45deg] opacity-80" />
    </template>

    <div class="flex min-h-full flex-col">
      <header class="text-center">
        <p class="text-sm uppercase tracking-[0.35em] text-petal-deep">{{ couple }}</p>
        <h1 class="mt-1 font-display text-5xl italic text-ink">Seating plan</h1>
      </header>

      <div class="mt-8 columns-2 gap-8 md:columns-3 lg:columns-4">
        <section
          v-for="table in tables"
          :key="table.id"
          :data-chart-table="table.name"
          class="mb-6 break-inside-avoid rounded-2xl border border-leaf/30 bg-white/50 p-4"
        >
          <h2 class="font-display text-2xl text-petal-deep">{{ table.name }}</h2>
          <ul class="mt-2 space-y-0.5 text-lg text-ink">
            <li v-for="guest in table.guests" :key="guest.id" data-chart-guest>{{ guest.name }}</li>
          </ul>
          <p v-if="!table.guests.length" class="mt-2 text-sm italic text-ink/50">No guests seated yet</p>
        </section>
      </div>
    </div>
    </PrintPage>
  </div>
</template>
