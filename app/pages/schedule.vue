<script setup lang="ts">
import { schedule } from "#shared/content";

// mockup 1a shows "1:30pm"-style times
const time = (iso: string) =>
  new Date(iso)
    .toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(" ", "");

const day = new Date(schedule[0]!.start).toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

useSeoMeta({
  title: "Schedule — Ciera & Martin",
  description: "The order of the day for Ciera and Martin's wedding.",
});
</script>

<template>
  <!-- full-bleed blush band per mockup 1a; content re-centres inside -->
  <section class="mx-[calc(50%-50vw)] bg-blush px-6 py-12 sm:py-20">
    <div class="text-center">
      <FloralHeading eyebrow="Order of celebration">The Day</FloralHeading>
      <p class="mt-2 text-leaf-deep">{{ day }}</p>
      <a
        href="/api/calendar.ics"
        class="mt-6 inline-block rounded-full bg-leaf-deep px-5 py-2.5 font-display text-sm text-cream transition hover:bg-leaf"
        >Add the day to your calendar</a
      >
    </div>

    <div class="relative mx-auto mt-12 max-w-2xl sm:mt-16">
      <!-- mobile: fixed narrow time column, line through the bloom column;
           sm+: mockup's centred alternating layout -->
      <div
        aria-hidden="true"
        class="absolute inset-y-2 left-[7rem] w-px -translate-x-1/2 bg-leaf-deep/35 sm:left-1/2"
      />
      <ol>
        <li
          v-for="(event, i) in schedule"
          :key="event.name"
          data-event
          class="relative grid grid-cols-[5.25rem_2.5rem_1fr] items-center gap-x-2 pb-10 last:pb-0 sm:grid-cols-[1fr_4.5rem_1fr] sm:gap-x-1"
        >
          <p
            class="order-1 text-left font-display text-xl text-petal-deep sm:text-3xl"
            :class="i % 2 === 0 ? 'sm:text-right' : 'sm:order-3'"
          >
            {{ time(event.start) }}
          </p>
          <FloralBloom class="order-2 mx-auto w-8 sm:w-9" />
          <div
            class="order-3 text-left"
            :class="i % 2 === 0 ? '' : 'sm:order-1 sm:text-right'"
          >
            <h2 class="font-display text-lg font-medium text-ink sm:text-2xl">
              {{ event.name }}
            </h2>
            <p
              v-if="event.description"
              class="mt-1.5 text-sm leading-relaxed text-ink/70"
            >
              {{ event.description }}
            </p>
            <p class="mt-2 text-xs text-leaf-deep">{{ event.location }}</p>
            <p class="mt-1.5 text-xs">
              <a
                :href="event.mapsUrl"
                target="_blank"
                rel="noopener"
                class="text-petal underline hover:text-petal-deep"
                >Google Maps</a
              >
              <span class="text-leaf-deep/50"> · </span>
              <a
                :href="`/api/calendar.ics?event=${i}`"
                class="text-leaf-deep underline hover:text-leaf"
                >Add to calendar</a
              >
            </p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>
