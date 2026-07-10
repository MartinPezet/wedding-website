<template>
  <div class="relative flex min-h-screen flex-col overflow-x-clip">
    <FloralHeader />
    <FallingPetals />
    <header class="relative z-10 mx-auto w-full max-w-3xl px-6 pt-6 text-center">
      <NuxtLink to="/" class="font-display text-2xl text-ink">Ciera &amp; Martin</NuxtLink>
      <nav class="mt-2 flex justify-center gap-6 text-sm uppercase tracking-widest text-leaf-deep">
        <NuxtLink to="/" class="hover:text-petal">Home</NuxtLink>
      </nav>
    </header>
    <main class="relative z-10 mx-auto w-full max-w-3xl grow px-6 py-10">
      <slot />
    </main>
    <footer class="relative z-10 py-8 text-center font-display text-sm text-leaf">
      Ciera &amp; Martin
    </footer>
  </div>
</template>
