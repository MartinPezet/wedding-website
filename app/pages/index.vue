<template>
  <section class="pt-12 text-center sm:pt-24">
    <p class="text-sm uppercase tracking-widest text-petal-deep">
      We're getting married
    </p>
    <h1 class="mt-4 text-5xl text-ink sm:text-6xl">
      Ciera <span class="text-petal">&amp;</span> Martin
    </h1>

    <FloralArch variant="arch" class="mt-12 w-64 sm:w-80 md:w-102">
      <NuxtImg
        src="/photos/couple.jpg"
        alt="Ciera and Martin"
        width="960"
        height="1200"
        sizes="256px sm:320px"
        class="h-auto w-full object-cover"
      />
    </FloralArch>

    <p class="mt-10 text-leaf-deep">
      Everything you need is here — the
      <NuxtLink
        to="/schedule"
        class="text-petal underline hover:text-petal-deep"
        >order of the day</NuxtLink
      >,
      <NuxtLink to="/travel" class="text-petal underline hover:text-petal-deep"
        >how to get there</NuxtLink
      >, and
      <NuxtLink to="/faq" class="text-petal underline hover:text-petal-deep"
        >answers to your questions</NuxtLink
      >.
    </p>
  </section>
</template>
