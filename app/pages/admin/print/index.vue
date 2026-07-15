<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Print — Wedding HQ', robots: 'noindex' })

const links = [
  { to: '/admin/print/letters', title: 'RSVP letters', desc: 'A5 invite letters, one per party, each with a personal QR code.' },
  { to: '/admin/print/seating', title: 'Seating chart', desc: 'Large-format chart of the seating plan for the venue wall.' },
  { to: '/admin/print/place-cards', title: 'Place cards', desc: 'A4 sheets of tent-fold cards with names and meal markers.' },
  { to: '/admin/print/handout', title: 'Day handout', desc: 'A5 order-of-the-day and venue notes from handout.json.' },
]
</script>

<template>
  <section>
    <h1 class="font-display text-3xl text-ink">Print</h1>
    <p class="mt-1 text-sm text-ink/60">Each opens a print-ready view — use your browser's Print → Save as PDF.</p>
    <ul class="mt-4 grid gap-3 sm:grid-cols-2">
      <li v-for="link in links" :key="link.to">
        <NuxtLink :to="link.to" class="block rounded-xl border border-ink/10 bg-white/70 p-4 hover:border-petal">
          <p class="font-display text-lg text-ink">{{ link.title }}</p>
          <p class="mt-1 text-sm text-ink/70">{{ link.desc }}</p>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
