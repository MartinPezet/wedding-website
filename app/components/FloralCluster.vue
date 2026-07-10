<script setup lang="ts">
// Floral art ported from the Claude Design mockup (option 1a); all fills
// route through theme tokens so the 1a→1b palette swap recolours this too.
const uid = useId()
const ref_ = (name: string) => `#${uid}-${name}`
</script>

<template>
  <svg viewBox="-250 -250 500 500" fill="none" aria-hidden="true" class="floral-cluster">
    <defs>
      <path :id="`${uid}-pt`" d="M0,3 C-13,-4 -15,-27 0,-38 C15,-27 13,-4 0,3 Z" />
      <path :id="`${uid}-pw`" d="M0,4 C-19,-2 -21,-30 0,-42 C21,-30 19,-2 0,4 Z" />
      <path :id="`${uid}-lf`" d="M0,0 C-13,-12 -15,-38 0,-58 C15,-38 13,-12 0,0 Z" />
      <g :id="`${uid}-ring8`">
        <use v-for="i in 8" :key="i" :href="ref_('pt')" :transform="`rotate(${(i - 1) * 45})`" />
      </g>
      <g :id="`${uid}-ring5`">
        <use v-for="i in 5" :key="i" :href="ref_('pw')" :transform="`rotate(${(i - 1) * 72})`" />
      </g>
      <g :id="`${uid}-bloom`">
        <use :href="ref_('ring8')" fill="var(--color-petal-soft)" />
        <use :href="ref_('ring8')" transform="rotate(22.5) scale(0.64)" fill="var(--color-petal-mid)" />
        <use :href="ref_('ring8')" transform="scale(0.34)" fill="var(--color-petal)" />
        <circle r="5" fill="var(--color-petal-deep)" />
      </g>
      <g :id="`${uid}-bloom2`">
        <use :href="ref_('ring5')" fill="var(--color-petal-mid)" />
        <use :href="ref_('ring5')" transform="rotate(36) scale(0.58)" fill="var(--color-petal-soft)" />
        <circle r="7" fill="var(--color-gold)" />
        <circle cx="0" cy="-11" r="2" fill="var(--color-gold-soft)" />
        <circle cx="10" cy="-4" r="2" fill="var(--color-gold-soft)" />
        <circle cx="7" cy="9" r="2" fill="var(--color-gold-soft)" />
        <circle cx="-7" cy="9" r="2" fill="var(--color-gold-soft)" />
        <circle cx="-10" cy="-4" r="2" fill="var(--color-gold-soft)" />
      </g>
      <g :id="`${uid}-sprig`">
        <path d="M0,0 Q10,-64 4,-132" fill="none" stroke="var(--color-leaf-deep)" stroke-width="3" />
        <use :href="ref_('lf')" transform="translate(7,-32) rotate(48) scale(0.55)" fill="var(--color-leaf)" />
        <use :href="ref_('lf')" transform="translate(7,-38) rotate(-42) scale(0.5)" fill="var(--color-leaf-soft)" />
        <use :href="ref_('lf')" transform="translate(9,-72) rotate(52) scale(0.5)" fill="var(--color-leaf)" />
        <use :href="ref_('lf')" transform="translate(9,-78) rotate(-46) scale(0.45)" fill="var(--color-leaf-soft)" />
        <use :href="ref_('lf')" transform="translate(7,-108) rotate(34) scale(0.42)" fill="var(--color-leaf-deep)" />
        <use :href="ref_('lf')" transform="translate(5,-130) rotate(-8) scale(0.44)" fill="var(--color-leaf)" />
      </g>
      <g :id="`${uid}-berry`">
        <path d="M0,0 Q-7,-28 -16,-46 M0,0 Q3,-26 12,-44 M0,0 Q-1,-22 -2,-50" fill="none" stroke="var(--color-leaf-deep)" stroke-width="2" />
        <circle cx="-16" cy="-48" r="5.5" fill="var(--color-petal)" />
        <circle cx="12" cy="-46" r="5.5" fill="var(--color-petal-deep)" />
        <circle cx="-2" cy="-52" r="5.5" fill="var(--color-petal-mid)" />
      </g>
      <g :id="`${uid}-bud`">
        <path d="M0,0 Q3,-24 0,-40" fill="none" stroke="var(--color-leaf-deep)" stroke-width="2.5" />
        <g transform="translate(0,-42)">
          <use :href="ref_('pt')" transform="scale(0.52)" fill="var(--color-petal)" />
          <use :href="ref_('pt')" transform="rotate(-32) scale(0.46)" fill="var(--color-petal-mid)" />
          <use :href="ref_('pt')" transform="rotate(32) scale(0.46)" fill="var(--color-petal-mid)" />
        </g>
        <use :href="ref_('lf')" transform="translate(0,-4) rotate(62) scale(0.32)" fill="var(--color-leaf)" />
      </g>
    </defs>

    <g class="sway sway-a">
      <use :href="ref_('sprig')" transform="rotate(-38) scale(1.5)" />
      <use :href="ref_('sprig')" transform="rotate(30) scale(1.25)" />
      <use :href="ref_('sprig')" transform="rotate(-4) scale(1.4)" />
      <use :href="ref_('berry')" transform="rotate(66) scale(1.3)" />
      <use :href="ref_('berry')" transform="rotate(-70) scale(1.2)" />
      <use :href="ref_('bud')" transform="rotate(52) scale(1.25)" />
      <use :href="ref_('bud')" transform="rotate(-58) scale(1.15)" />
    </g>
    <g class="sway sway-b">
      <use :href="ref_('bloom2')" transform="translate(-54,-66) scale(1.25)" />
      <use :href="ref_('bloom')" transform="translate(36,-100) scale(1.05)" />
      <use :href="ref_('bloom')" transform="translate(-10,-24) scale(0.8)" />
      <use :href="ref_('bloom2')" transform="translate(70,-32) scale(0.68)" />
      <use :href="ref_('bloom')" transform="translate(-20,-152) scale(0.85)" />
    </g>
  </svg>
</template>

<style scoped>
.floral-cluster .sway {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}

/* Continuous gentle sway (mockup timings); static under reduced motion. */
@media (prefers-reduced-motion: no-preference) {
  .floral-cluster .sway-a {
    animation: cluster-sway 7s ease-in-out infinite alternate;
  }

  .floral-cluster .sway-b {
    animation: cluster-sway-slow 8.5s ease-in-out -2s infinite alternate;
  }
}

@keyframes cluster-sway {
  from {
    transform: rotate(-2.4deg);
  }

  to {
    transform: rotate(2.6deg);
  }
}

@keyframes cluster-sway-slow {
  from {
    transform: rotate(1.8deg);
  }

  to {
    transform: rotate(-2.2deg);
  }
}
</style>
