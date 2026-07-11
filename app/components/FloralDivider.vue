<script setup lang="ts">
// Section divider from the mockup (a-div): leafy curve with a small bloom.
const uid = useId()
const ref_ = (name: string) => `#${uid}-${name}`
</script>

<template>
  <svg viewBox="-80 -34 160 44" fill="none" aria-hidden="true">
    <defs>
      <path :id="`${uid}-pt`" d="M0,3 C-13,-4 -15,-27 0,-38 C15,-27 13,-4 0,3 Z" />
      <path :id="`${uid}-lf`" d="M0,0 C-13,-12 -15,-38 0,-58 C15,-38 13,-12 0,0 Z" />
      <g :id="`${uid}-ring`">
        <use v-for="i in 8" :key="i" :href="ref_('pt')" :transform="`rotate(${(i - 1) * 45})`" />
      </g>
    </defs>
    <path d="M-72,0 Q0,-13 72,0" stroke="var(--color-leaf)" stroke-width="2" />
    <use :href="ref_('lf')" transform="translate(-42,-5) rotate(-108) scale(0.28)" fill="var(--color-leaf)" />
    <use :href="ref_('lf')" transform="translate(42,-5) rotate(108) scale(0.28)" fill="var(--color-leaf)" />
    <use :href="ref_('lf')" transform="translate(-24,-8) rotate(-96) scale(0.22)" fill="var(--color-leaf-soft)" />
    <use :href="ref_('lf')" transform="translate(24,-8) rotate(96) scale(0.22)" fill="var(--color-leaf-soft)" />
    <g transform="translate(0,-7) scale(0.3)">
      <use :href="ref_('ring')" fill="var(--color-petal-soft)" />
      <use :href="ref_('ring')" transform="rotate(22.5) scale(0.64)" fill="var(--color-petal-mid)" />
      <use :href="ref_('ring')" transform="scale(0.34)" fill="var(--color-petal)" />
      <circle r="5" fill="var(--color-petal-deep)" />
    </g>
  </svg>
</template>
