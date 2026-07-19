<script setup lang="ts">
import { schedule } from "~~/shared/content";

// footer date per mockup 1a: "17 · 01 · 2027"
const weddingDate = new Date(schedule[0]!.start);
const footerDate = [
  String(weddingDate.getDate()).padStart(2, "0"),
  String(weddingDate.getMonth() + 1).padStart(2, "0"),
  weddingDate.getFullYear(),
].join(" · ");

// mobile dropdown nav; closes on navigation
const menuOpen = ref(false);
const route = useRoute();
watch(
  () => route.path,
  () => {
    menuOpen.value = false;
  },
);
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-x-clip">
    <FallingPetals />
    <!-- sticky nav per mockup 1a: translucent blurred cream bar -->
    <header
      class="sticky top-0 z-50 border-b border-ink/10 bg-cream/60 backdrop-blur-md"
    >
      <FloralHeader floral-classes="md:w-[50vw]" />
      <div
        class="flex flex-col items-center sm:block mx-auto max-w-3xl px-6 pt-4 pb-1 text-center sm:py-3"
      >
        <NuxtLink
          to="/"
          class="font-display text-2xl text-ink max-sm:leading-none"
          >Ciera <span class="text-petal">&amp;</span> Martin</NuxtLink
        >
        <button
          type="button"
          class="w-fit p-1 transition-all duration-300 text-leaf-deep hover:text-petal sm:hidden"
          :class="{ '-rotate-180': menuOpen }"
          :aria-expanded="menuOpen"
          aria-controls="site-nav"
          aria-label="Menu"
          @click="menuOpen = !menuOpen"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-chevron-down-icon lucide-chevron-down"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <nav
          id="site-nav"
          class="mt-3 flex-col gap-y-3 pb-4 text-sm uppercase tracking-widest text-leaf-deep sm:mt-1.5 sm:flex sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2 sm:pb-0"
          :class="menuOpen ? 'flex' : 'hidden'"
        >
          <NuxtLink
            to="/"
            class="transition-colors duration-200 hover:text-petal"
            exact-active-class="text-petal-deep hover:text-petal-deep"
            >Home</NuxtLink
          >
          <NuxtLink
            to="/schedule"
            class="hover:text-petal"
            exact-active-class="text-petal-deep hover:text-petal-deep"
            >Schedule</NuxtLink
          >
          <NuxtLink
            to="/rsvp"
            class="hover:text-petal"
            exact-active-class="text-petal-deep hover:text-petal-deep"
            >RSVP</NuxtLink
          >
          <NuxtLink
            to="/gifts"
            class="hover:text-petal"
            exact-active-class="text-petal-deep hover:text-petal-deep"
            >Gifts</NuxtLink
          >
          <NuxtLink
            to="/travel"
            class="hover:text-petal"
            exact-active-class="text-petal-deep hover:text-petal-deep"
            >Travel</NuxtLink
          >
          <NuxtLink
            to="/faq"
            class="hover:text-petal"
            exact-active-class="text-petal-deep hover:text-petal-deep"
            >FAQ</NuxtLink
          >
        </nav>
      </div>
    </header>
    <main class="relative z-10 mx-auto w-full max-w-3xl grow px-6 pb-8">
      <slot class="pt-12" />
    </main>
    <footer class="relative z-10 py-10 text-center">
      <FloralTulipCorner class="pointer-events-none absolute bottom-0 -left-2 w-14 sm:-left-3 sm:w-32" />
      <FloralTulipCorner class="pointer-events-none absolute bottom-0 -right-2 w-14 -scale-x-100 sm:-right-3 sm:w-32" />
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
