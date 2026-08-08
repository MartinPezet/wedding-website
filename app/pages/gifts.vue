<script setup lang="ts">
import { gifts } from "#shared/content";

useSeoMeta({
  title: "Gifts — Ciera & Martin",
  description: "Our honeymoon fund.",
});
</script>

<template>
  <section class="pt-12 text-center sm:pt-24">
    <FloralHeading v-reveal.focal eyebrow="Gifts">No boxes to carry</FloralHeading>
    <!-- no v-reveal: the arch carries its own bloom, and both would drive transform -->
    <FloralArch variant="circle" class="mt-10 w-full max-w-72 sm:max-w-92">
      <NuxtImg
        src="/photos/couple.jpg"
        alt="Ciera and Martin"
        width="960"
        height="960"
        sizes="192px sm:224px"
        class="aspect-square h-auto w-full object-cover"
      />
    </FloralArch>

    <p v-reveal class="mx-auto mt-8 max-w-prose text-lg text-ink/80">
      {{ gifts.message }}
    </p>
    <a
      v-reveal
      :href="gifts.url"
      target="_blank"
      rel="noopener"
      class="mt-8 inline-block rounded-full bg-leaf-deep px-6 py-3 font-display text-cream transition hover:bg-leaf"
      >{{ gifts.linkText }}</a
    >
  </section>
</template>
