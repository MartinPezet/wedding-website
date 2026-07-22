<script setup lang="ts">
import { handout } from '#shared/content'

definePageMeta({ layout: 'print' })
useSeoMeta({ title: 'Day handout — Wedding HQ', robots: 'noindex' })

const couple = 'Ciera & Martin'
</script>

<template>
  <PrintPage size="a5">
    <template #bleed>
      <FloralHeader />
      <FloralTulipCorner class="absolute bottom-0 left-0 w-24" />
      <FloralTulipCorner class="absolute bottom-0 right-0 w-24 -scale-x-100" />
    </template>
    <article class="flex min-h-full flex-col text-center">
      <div>
        <p class="mt-8 text-xs uppercase tracking-[0.35em] text-petal-deep">{{ couple }}</p>
        <h1 class="mt-2 font-display text-4xl italic text-ink">On the day</h1>
        <FloralDivider class="mx-auto mt-3 w-36" />

        <section
          v-for="section in handout.sections"
          :key="section.title"
          data-handout-section
          class="mt-6 text-left"
        >
          <h2 class="font-display text-lg text-petal-deep">{{ section.title }}</h2>
          <ul class="mt-1 space-y-1 text-sm text-ink/80">
            <li v-for="item in section.items" :key="item">{{ item }}</li>
          </ul>
        </section>
      </div>
    </article>
  </PrintPage>
</template>
