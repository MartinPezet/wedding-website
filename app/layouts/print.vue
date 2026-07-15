<script setup lang="ts">
// Chrome-free layout for print routes: a screen-only toolbar plus the sheets.
// Routes still live under /admin/**, so auth.global guards them.
const doPrint = () => window.print()
</script>

<template>
  <div class="min-h-screen bg-cream">
    <div class="no-print sticky top-0 z-50 flex items-center gap-4 border-b border-ink/10 bg-cream/90 px-4 py-3 backdrop-blur">
      <NuxtLink to="/admin/print" class="text-sm text-leaf-deep hover:text-petal">← Print menu</NuxtLink>
      <button
        type="button"
        class="ms-auto rounded-full bg-leaf-deep px-4 py-1.5 text-sm text-cream hover:bg-leaf"
        @click="doPrint"
      >
        Print / Save as PDF
      </button>
    </div>
    <main class="py-6">
      <slot />
    </main>
  </div>
</template>
