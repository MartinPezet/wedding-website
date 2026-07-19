<script setup lang="ts">
// Tulip corner art (footer + print letters/handout): tulip stems and a bud
// rising from a fan of grass-like blades. Static site furniture — no sway.
// Drawn rooted at the bottom origin; mirror the opposite corner with
// -scale-x-100. All fills route through theme tokens.
const uid = useId()
const ref_ = (name: string) => `#${uid}-${name}`
</script>

<template>
  <svg viewBox="-70 -195 160 200" fill="none" aria-hidden="true">
    <defs>
      <!-- grass blades (tulip-leaf shape), three tints -->
      <path :id="`${uid}-gr1`" d="M0,0 C-7,-16 -8,-52 0,-80 C8,-52 7,-16 0,0 Z" fill="var(--color-leaf)" />
      <path :id="`${uid}-gr2`" d="M0,0 C-7,-16 -8,-52 0,-80 C8,-52 7,-16 0,0 Z" fill="var(--color-leaf-soft)" />
      <path :id="`${uid}-gr3`" d="M0,0 C-7,-16 -8,-52 0,-80 C8,-52 7,-16 0,0 Z" fill="var(--color-leaf-deep)" />
      <!-- tulip cup petals, three tints -->
      <path :id="`${uid}-tpA`" d="M0,4 C-11,-2 -12,-26 0,-34 C12,-26 11,-2 0,4 Z" fill="var(--color-tulip)" />
      <path :id="`${uid}-tpB`" d="M0,4 C-11,-2 -12,-26 0,-34 C12,-26 11,-2 0,4 Z" fill="var(--color-tulip-mid)" />
      <path :id="`${uid}-tpC`" d="M0,4 C-11,-2 -12,-26 0,-34 C12,-26 11,-2 0,4 Z" fill="var(--color-tulip-deep)" />
      <g :id="`${uid}-tcup`">
        <use :href="ref_('tpB')" transform="translate(-9,16) rotate(-22)" />
        <use :href="ref_('tpB')" transform="translate(9,16) rotate(22)" />
        <use :href="ref_('tpC')" transform="translate(-4,17) rotate(-8) scale(0.92)" />
        <use :href="ref_('tpA')" transform="translate(0,16) scale(1.04)" />
      </g>
      <g :id="`${uid}-tstem`">
        <path d="M0,0 Q6,-70 2,-138" fill="none" stroke="var(--color-leaf-deep)" stroke-width="3" />
        <use :href="ref_('gr1')" transform="translate(2,-8) rotate(30) scale(0.9)" />
        <use :href="ref_('gr2')" transform="translate(3,-14) rotate(-24) scale(0.8)" />
        <use :href="ref_('tcup')" transform="translate(2,-150) scale(0.8)" />
      </g>
      <g :id="`${uid}-bud`">
        <path d="M0,0 Q3,-24 0,-44" fill="none" stroke="var(--color-leaf-deep)" stroke-width="2.5" />
        <g transform="translate(0,-46)">
          <use :href="ref_('tpB')" transform="rotate(-14) scale(0.55)" />
          <use :href="ref_('tpB')" transform="rotate(14) scale(0.55)" />
          <use :href="ref_('tpC')" transform="scale(0.5)" />
        </g>
        <use :href="ref_('gr1')" transform="translate(0,-2) rotate(56) scale(0.4)" />
      </g>
    </defs>

    <!-- grass fan -->
    <use :href="ref_('gr3')" transform="rotate(-48)" />
    <use :href="ref_('gr1')" transform="rotate(-30) scale(1.2)" />
    <use :href="ref_('gr2')" transform="rotate(-14) scale(0.9)" />
    <use :href="ref_('gr1')" transform="rotate(4) scale(1.15)" />
    <use :href="ref_('gr2')" transform="rotate(22)" />
    <use :href="ref_('gr3')" transform="rotate(40) scale(0.85)" />
    <!-- tulips + bud -->
    <use :href="ref_('tstem')" transform="rotate(-12)" />
    <use :href="ref_('tstem')" transform="translate(26,0) rotate(10) scale(0.8)" />
    <use :href="ref_('bud')" transform="translate(-20,0) rotate(-26) scale(0.95)" />
  </svg>
</template>
