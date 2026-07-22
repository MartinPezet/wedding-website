<script setup lang="ts">
import { travel } from "#shared/content";

useSeoMeta({
  title: "Travel & Stay — Ciera & Martin",
  description: "How to get to the wedding and where to stay.",
});
</script>

<template>
  <section
    class="flex flex-col items-center mx-[calc(50%-50vw)] bg-blush px-6 py-12 text-center sm:py-24"
  >
    <div class="text-center max-w-[720px]">
      <FloralHeading eyebrow="Getting there">Travel &amp; Stay</FloralHeading>

      <h2 class="mt-12 text-2xl text-ink">Where to stay</h2>
      <ul class="mt-6 space-y-6">
        <li
          v-for="hotel in travel.hotels"
          :key="hotel.name"
          class="rounded-3xl bg-cream px-6 py-8"
        >
          <h3 class="text-xl text-ink">{{ hotel.name }}</h3>
          <p class="mt-2 text-ink/80">{{ hotel.description }}</p>
          <p v-if="hotel.distance" class="mt-2 text-sm text-leaf-deep">
            {{ hotel.distance }}
          </p>
          <a
            v-if="hotel.url"
            :href="hotel.url"
            target="_blank"
            rel="noopener"
            class="mt-3 inline-block text-sm text-petal underline hover:text-petal-deep"
            >Visit website</a
          >
        </li>
      </ul>

      <FloralDivider class="mx-auto mt-1 w-40 mt-12" />
      <h2 class="mt-6 text-2xl text-ink">Getting around</h2>
      <ul class="mt-6 space-y-6">
        <li
          v-for="entry in travel.transport"
          :key="entry.name"
          class="rounded-3xl bg-cream px-6 py-6 shadow-sm"
        >
          <h3 class="text-xl text-ink">{{ entry.name }}</h3>
          <p class="mt-2 text-ink/80">{{ entry.description }}</p>
          <a
            v-if="entry.url"
            :href="entry.url"
            target="_blank"
            rel="noopener"
            class="mt-2 inline-block text-sm text-petal underline hover:text-petal-deep"
            >More info</a
          >
        </li>
      </ul>

      <h2 class="mt-12 text-2xl text-ink">Parking</h2>
      <p class="mt-4 text-ink/80">{{ travel.parking }}</p>
    </div>
  </section>
</template>
