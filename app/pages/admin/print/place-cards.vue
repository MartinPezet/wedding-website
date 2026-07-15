<script setup lang="ts">
import { menu } from '~~/shared/content'

definePageMeta({ layout: 'print' })
useSeoMeta({ title: 'Place cards — Wedding HQ', robots: 'noindex' })

interface CardGuest {
  id: number
  name: string
  attending: boolean
  tableId: number | null
  seatIndex: number | null
  mainChoiceId: string | null
}
interface CardTable { id: number, name: string }

const { data } = await useFetch<{ tables: CardTable[], guests: CardGuest[] }>('/api/admin/seating')

const mealNames = new Map(menu.courses.flatMap(course =>
  [...course.options, ...(course.childOptions ?? [])].map(option => [option.id, option.name])))

// table render order = the seating data's own order (sortOrder), so cards come
// off the printer table-by-table, seat-by-seat, in placement order
const tableOrder = computed(() => new Map((data.value?.tables ?? []).map((table, index) => [table.id, index])))

const cards = computed(() => {
  const seated = (data.value?.guests ?? [])
    .filter(guest => guest.attending && guest.tableId != null && guest.seatIndex != null)
  return seated
    .slice()
    .sort((a, b) =>
      (tableOrder.value.get(a.tableId!) ?? 0) - (tableOrder.value.get(b.tableId!) ?? 0)
      || a.seatIndex! - b.seatIndex!)
    .map(guest => ({
      id: guest.id,
      name: guest.name,
      meal: guest.mainChoiceId ? mealNames.get(guest.mainChoiceId) ?? '' : '',
    }))
})

// 2×4 tent-fold cards per A4 sheet
const CARDS_PER_PAGE = 8
const pages = computed(() => {
  const out: (typeof cards.value)[] = []
  for (let i = 0; i < cards.value.length; i += CARDS_PER_PAGE) {
    out.push(cards.value.slice(i, i + CARDS_PER_PAGE))
  }
  return out
})
</script>

<template>
  <div>
    <PrintPage v-for="(page, pageIndex) in pages" :key="pageIndex" size="a4">
      <div class="grid h-full grid-cols-2">
        <div
          v-for="card in page"
          :key="card.id"
          :data-place-card="card.name"
          class="relative flex flex-col border border-dashed border-ink/25"
        >
          <!-- crop marks at each card corner for the guillotine -->
          <span data-crop class="absolute left-0 top-0 h-2.5 w-2.5 border-l border-t border-ink/50" />
          <span data-crop class="absolute right-0 top-0 h-2.5 w-2.5 border-r border-t border-ink/50" />
          <span data-crop class="absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-ink/50" />
          <span data-crop class="absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-ink/50" />

          <!-- top half printed upside-down so it reads once the tent is folded -->
          <div class="flex flex-1 rotate-180 items-center justify-center p-3">
            <div class="text-center">
              <p class="font-display text-2xl text-ink">{{ card.name }}</p>
              <p v-if="card.meal" class="mt-1 text-xs uppercase tracking-widest text-petal-deep">{{ card.meal }}</p>
            </div>
          </div>

          <div data-fold class="border-t border-dashed border-leaf-deep/60" />

          <div class="flex flex-1 items-center justify-center p-3">
            <div class="text-center">
              <p class="font-display text-2xl text-ink">{{ card.name }}</p>
              <p v-if="card.meal" class="mt-1 text-xs uppercase tracking-widest text-petal-deep">{{ card.meal }}</p>
            </div>
          </div>
        </div>
      </div>
    </PrintPage>
    <p v-if="!cards.length" class="no-print p-8 text-center text-ink/60">No seated guests yet.</p>
  </div>
</template>
