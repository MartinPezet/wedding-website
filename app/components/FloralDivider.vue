<script setup lang="ts">
// Section divider (mockup 2a c-div, refined): leafy curve with a small whole
// hydrangea mophead at its centre.
const uid = useId()
const ref_ = (name: string) => `#${uid}-${name}`
</script>

<template>
  <svg viewBox="-80 -34 160 44" fill="none" aria-hidden="true">
    <defs>
      <path :id="`${uid}-fp1`" d="M0,1.5 C-5.5,-1.5 -6.5,-11 0,-15.5 C6.5,-11 5.5,-1.5 0,1.5 Z" fill="var(--color-petal-soft)" />
      <path :id="`${uid}-fp2`" d="M0,1.5 C-5.5,-1.5 -6.5,-11 0,-15.5 C6.5,-11 5.5,-1.5 0,1.5 Z" fill="var(--color-petal)" />
      <path :id="`${uid}-fp3`" d="M0,1.5 C-5.5,-1.5 -6.5,-11 0,-15.5 C6.5,-11 5.5,-1.5 0,1.5 Z" fill="var(--color-petal-mid)" />
      <path :id="`${uid}-lf1`" d="M0,0 C-15,-10 -17,-36 0,-54 C17,-36 15,-10 0,0 Z" fill="var(--color-leaf)" />
      <path :id="`${uid}-lf2`" d="M0,0 C-15,-10 -17,-36 0,-54 C17,-36 15,-10 0,0 Z" fill="var(--color-leaf-soft)" />
      <g :id="`${uid}-fla`">
        <use v-for="i in 4" :key="i" :href="ref_('fp1')" :transform="`rotate(${(i - 1) * 90})`" />
        <circle r="2.6" fill="var(--color-gold-soft)" />
      </g>
      <g :id="`${uid}-flb`">
        <use v-for="i in 4" :key="i" :href="ref_('fp2')" :transform="`rotate(${(i - 1) * 90})`" />
        <circle r="2.6" fill="var(--color-gold-soft)" />
      </g>
      <g :id="`${uid}-flc`">
        <use v-for="i in 4" :key="i" :href="ref_('fp3')" :transform="`rotate(${(i - 1) * 90})`" />
        <circle r="2.6" fill="var(--color-gold-soft)" />
      </g>
      <g :id="`${uid}-bloom`">
        <use :href="ref_('flb')" transform="translate(0,-28) rotate(10)" />
        <use :href="ref_('fla')" transform="translate(24,-16) rotate(40) scale(0.92)" />
        <use :href="ref_('flc')" transform="translate(29,8) rotate(-20) scale(0.85)" />
        <use :href="ref_('fla')" transform="translate(12,27) rotate(25) scale(0.95)" />
        <use :href="ref_('flb')" transform="translate(-13,28) rotate(-35) scale(0.9)" />
        <use :href="ref_('flc')" transform="translate(-28,9) rotate(15) scale(0.88)" />
        <use :href="ref_('fla')" transform="translate(-25,-17) rotate(-42) scale(0.94)" />
        <use :href="ref_('flc')" transform="translate(-9,-8) rotate(30) scale(0.8)" />
        <use :href="ref_('flb')" transform="translate(11,-4) rotate(-15) scale(1.05)" />
        <use :href="ref_('fla')" transform="translate(0,12) rotate(55) scale(0.75)" />
      </g>
    </defs>
    <path d="M-72,0 Q0,-13 72,0" stroke="var(--color-leaf)" stroke-width="2" />
    <use :href="ref_('lf1')" transform="translate(-42,-5) rotate(-108) scale(0.28)" />
    <use :href="ref_('lf1')" transform="translate(42,-5) rotate(108) scale(0.28)" />
    <use :href="ref_('lf2')" transform="translate(-24,-8) rotate(-96) scale(0.22)" />
    <use :href="ref_('lf2')" transform="translate(24,-8) rotate(96) scale(0.22)" />
    <use :href="ref_('bloom')" transform="translate(0,-10) scale(0.45)" />
  </svg>
</template>
