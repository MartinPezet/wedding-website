<script setup lang="ts">
import { qrSvg } from '~~/shared/utils/qr'

definePageMeta({ layout: 'print' })
useSeoMeta({ title: 'RSVP letters — Wedding HQ', robots: 'noindex' })

interface Party { id: number, name: string, token: string }
const { data } = await useFetch<{ parties: Party[] }>('/api/admin/parties')
const route = useRoute()

// absolute RSVP URL; origin resolves on the client (this is a browser-only
// print view), mirroring the dashboard's copy-link behaviour
const origin = import.meta.client ? window.location.origin : ''
const rsvpUrl = (token: string) => `${origin}/?t=${token}`

// batch = every party; ?party=<id> reprints a single one
const selected = computed(() => {
  const all = data.value?.parties ?? []
  const only = route.query.party
  return only ? all.filter(party => String(party.id) === String(only)) : all
})

interface Letter { party: Party, url: string, qr: string }
const letters = ref<Letter[]>([])
async function buildLetters() {
  letters.value = await Promise.all(selected.value.map(async party => ({
    party,
    url: rsvpUrl(party.token),
    qr: await qrSvg(rsvpUrl(party.token)),
  })))
}
await buildLetters()

// ponytail: placeholder invite copy + names/date/venue — user supplies final
// wording during content pass. [[content-placeholders-pending]]
const couple = 'Ciera & Martin'
const inviteCopy = 'Together with our families, we would be delighted for you to join us '
  + 'as we celebrate our wedding. Please let us know if you can make it by scanning '
  + 'the code below — it takes you straight to your personal RSVP.'
const dateLine = 'Saturday 17th January 2027'
const venueLine = 'Huntsham Court, Devon'
</script>

<template>
  <div>
    <PrintPage v-for="entry in letters" :key="entry.party.id" size="a5">
      <template #bleed>
        <FloralHeader />
        <FloralTulipCorner class="absolute bottom-0 left-0 w-24" />
        <FloralTulipCorner class="absolute bottom-0 right-0 w-24 -scale-x-100" />
      </template>
      <article data-letter class="flex min-h-full flex-col items-center text-center">
        <div class="flex w-full flex-col items-center">
          <p class="mt-10 text-xs uppercase tracking-[0.35em] text-petal-deep">You're invited</p>
          <h1 class="mt-2 font-display text-4xl italic text-ink">{{ couple }}</h1>
          <FloralDivider class="mx-auto mt-3 w-36" />

          <p class="mt-8 font-display text-lg text-ink">Dear {{ entry.party.name }},</p>
          <p class="mt-3 max-w-[110mm] text-sm leading-relaxed text-ink/80">{{ inviteCopy }}</p>
          <p class="mt-5 text-sm text-ink/80">{{ dateLine }}<br>{{ venueLine }}</p>

          <div class="mt-8">
            <!-- eslint-disable-next-line vue/no-v-html -- QR SVG generated locally by qrSvg -->
            <div data-qr class="mx-auto h-[35mm] w-[35mm] text-ink" v-html="entry.qr" />
            <p class="mt-3 text-xs text-ink/60">Scan to RSVP, or visit</p>
            <p data-fallback class="break-all text-xs font-medium text-petal-deep">{{ entry.url }}</p>
          </div>
        </div>
      </article>
    </PrintPage>
    <p v-if="!letters.length" class="no-print p-8 text-center text-ink/60">No parties to print yet.</p>
  </div>
</template>
