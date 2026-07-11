<script setup lang="ts">
// Single bloom glyph from the mockup (a-bloom): three petal rings + centre.
const uid = useId()
const ref_ = (name: string) => `#${uid}-${name}`
</script>

<template>
  <svg viewBox="-42 -42 84 84" fill="none" aria-hidden="true">
    <defs>
      <path :id="`${uid}-pt`" d="M0,3 C-13,-4 -15,-27 0,-38 C15,-27 13,-4 0,3 Z" />
      <g :id="`${uid}-ring`">
        <use v-for="i in 8" :key="i" :href="ref_('pt')" :transform="`rotate(${(i - 1) * 45})`" />
      </g>
    </defs>
    <use :href="ref_('ring')" fill="var(--color-petal-soft)" />
    <use :href="ref_('ring')" transform="rotate(22.5) scale(0.64)" fill="var(--color-petal-mid)" />
    <use :href="ref_('ring')" transform="scale(0.34)" fill="var(--color-petal)" />
    <circle r="5" fill="var(--color-petal-deep)" />
  </svg>
</template>
