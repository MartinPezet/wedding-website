<script setup lang="ts">
// Section heading in the mockup-1a style: eyebrow, italic Fraunces title,
// floral divider underneath.
defineProps<{ eyebrow: string }>()
</script>

<template>
  <div class="text-center">
    <p class="text-xs font-medium uppercase tracking-[0.4em] text-petal-deep">{{ eyebrow }}</p>
    <h1 class="mt-3 font-display text-5xl font-light italic text-ink sm:text-6xl"><slot /></h1>
    <FloralDivider class="mx-auto mt-1 w-40" />
  </div>
</template>
