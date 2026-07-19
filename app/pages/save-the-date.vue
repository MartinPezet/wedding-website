<script setup lang="ts">
import { schedule } from "~~/shared/content";

// public save-the-date: no session, no site chrome — layout: false skips the
// nav header entirely; minimal footer is inlined below
definePageMeta({ layout: false });

const weddingDate = new Date(schedule[0]!.start);
const longDate = weddingDate.toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const footerDate = [
  String(weddingDate.getDate()).padStart(2, "0"),
  String(weddingDate.getMonth() + 1).padStart(2, "0"),
  weddingDate.getFullYear(),
].join(" · ");

useSeoMeta({
  title: "Save the Date — Ciera & Martin",
  description: `Ciera and Martin are getting married on ${longDate} in Devon, England. Save the date!`,
  ogTitle: "Save the Date — Ciera & Martin",
  ogDescription: `${longDate} — Devon, England. Invitation to follow.`,
  ogImage: "/og.png",
});
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-x-clip">
    <FallingPetals />
    <FloralHeader floral-classes="md:w-[50vw]" />
    <main class="mt-16 relative z-10 mx-auto w-full max-w-3xl grow px-6 pb-8">
      <section class="pt-8 text-center sm:pt-24">
        <p class="text-sm uppercase tracking-widest text-petal-deep">
          Save the date
        </p>
        <h1 class="mt-4 text-5xl text-ink sm:text-6xl">
          Ciera <span class="text-petal">&amp;</span> Martin
        </h1>

        <!-- circle garland overflows ~70-90px above the photo; margin covers it plus breathing room -->
        <FloralArch
          variant="circle"
          class="mt-12 w-64 sm:mt-16 sm:w-80 md:mt-20 md:w-102 lg:w-120"
        >
          <NuxtImg
            src="/photos/couple.jpg"
            alt="Ciera and Martin"
            width="960"
            height="960"
            sizes="256px sm:320px md:408px lg:480px"
            class="aspect-square h-auto w-full object-cover"
          />
        </FloralArch>

        <p class="mt-12 font-display text-3xl text-ink sm:text-4xl">
          {{ longDate }}
        </p>
        <p class="mt-3 text-sm uppercase tracking-widest text-leaf-deep">
          Devon, England
        </p>
        <p class="mt-8 italic text-leaf-deep">Invitation to follow</p>
      </section>
    </main>
    <footer class="relative z-10 py-10 text-center">
      <FloralDivider class="mx-auto w-40" />
      <p class="mt-3 font-display text-2xl text-ink">
        C <span class="italic text-petal">&amp;</span> M
      </p>
      <p class="mt-3 text-[11px] uppercase tracking-[0.34em] text-ink/60">
        {{ footerDate }} — Devon, England
      </p>
    </footer>
  </div>
</template>
