<script setup lang="ts">
import { faq } from "~~/shared/content";

useSeoMeta({
  title: "FAQ — Ciera & Martin",
  description: "Answers to the questions everyone asks.",
});
</script>

<template>
  <section class="pt-12 sm:pt-24">
    <FloralHeading eyebrow="Good to know"
      >Questions &amp; Answers</FloralHeading
    >
    <dl class="mt-12 space-y-8">
      <div
        v-for="entry in faq"
        :key="entry.question"
        class="rounded-3xl bg-blush px-6 py-6"
      >
        <dt class="font-display text-lg text-petal-deep">
          {{ entry.question }}
        </dt>
        <dd class="mt-2 text-ink/80">{{ entry.answer }}</dd>
      </div>
    </dl>
  </section>
</template>
