<script setup lang="ts">
// Floral bush ported from mockup 2a (c-cluster): leafy sprigs + hydrangea
// berries sway on one timing, hydrangea mopheads on another, with tulip
// stems mixed in. All fills route through theme tokens.
const uid = useId()
const ref_ = (name: string) => `#${uid}-${name}`
</script>

<template>
  <svg viewBox="-250 -250 500 500" fill="none" aria-hidden="true" class="floral-cluster">
    <defs>
      <!-- hydrangea floret (four-petal cross), three tints -->
      <path :id="`${uid}-fp1`" d="M0,1.5 C-5.5,-1.5 -6.5,-11 0,-15.5 C6.5,-11 5.5,-1.5 0,1.5 Z" fill="var(--color-petal-soft)" />
      <path :id="`${uid}-fp2`" d="M0,1.5 C-5.5,-1.5 -6.5,-11 0,-15.5 C6.5,-11 5.5,-1.5 0,1.5 Z" fill="var(--color-petal)" />
      <path :id="`${uid}-fp3`" d="M0,1.5 C-5.5,-1.5 -6.5,-11 0,-15.5 C6.5,-11 5.5,-1.5 0,1.5 Z" fill="var(--color-petal-mid)" />
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
      <!-- leaves + tulip leaf -->
      <path :id="`${uid}-lf1`" d="M0,0 C-15,-10 -17,-36 0,-54 C17,-36 15,-10 0,0 Z" fill="var(--color-leaf)" />
      <path :id="`${uid}-lf2`" d="M0,0 C-15,-10 -17,-36 0,-54 C17,-36 15,-10 0,0 Z" fill="var(--color-leaf-soft)" />
      <path :id="`${uid}-lf3`" d="M0,0 C-15,-10 -17,-36 0,-54 C17,-36 15,-10 0,0 Z" fill="var(--color-leaf-deep)" />
      <path :id="`${uid}-tlf`" d="M0,0 C-7,-16 -8,-52 0,-80 C8,-52 7,-16 0,0 Z" fill="var(--color-leaf)" />
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
      <!-- small + large hydrangea mopheads -->
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
      <g :id="`${uid}-bloomX`">
        <use :href="ref_('bloom')" />
        <use :href="ref_('flc')" transform="translate(14,-22) rotate(70) scale(0.7)" />
        <use :href="ref_('fla')" transform="translate(-14,-25) rotate(-20) scale(0.72)" />
        <use :href="ref_('flb')" transform="translate(22,14) rotate(35) scale(0.7)" />
        <use :href="ref_('flc')" transform="translate(-21,18) rotate(-50) scale(0.68)" />
        <use :href="ref_('flb')" transform="translate(-2,-16) rotate(12) scale(0.66)" />
        <use :href="ref_('fla')" transform="translate(3,26) rotate(80) scale(0.6)" />
        <use :href="ref_('flc')" transform="translate(-17,2) rotate(42) scale(0.6)" />
        <use :href="ref_('flb')" transform="translate(19,-3) rotate(-30) scale(0.58)" />
        <use :href="ref_('flb')" transform="translate(7,-30) rotate(24) scale(0.62)" />
        <use :href="ref_('fla')" transform="translate(-20,-12) rotate(-38) scale(0.7)" />
        <use :href="ref_('flc')" transform="translate(-6,20) rotate(60) scale(0.65)" />
        <use :href="ref_('fla')" transform="translate(18,22) rotate(-12) scale(0.62)" />
        <use :href="ref_('flb')" transform="translate(-27,-4) rotate(48) scale(0.6)" />
        <use :href="ref_('fla')" transform="translate(6,-8) rotate(85) scale(0.7)" />
        <use :href="ref_('flc')" transform="translate(28,-8) rotate(-55) scale(0.6)" />
        <use :href="ref_('fla')" transform="translate(-13,10) rotate(18) scale(0.62)" />
        <use :href="ref_('flb')" transform="translate(0,-24) rotate(-65) scale(0.6)" />
        <use :href="ref_('flc')" transform="translate(14,-14) rotate(38) scale(0.58)" />
        <use :href="ref_('fla')" transform="translate(-22,25) rotate(-28) scale(0.55)" />
        <use :href="ref_('flb')" transform="translate(26,20) rotate(52) scale(0.55)" />
      </g>
      <!-- leafy sprig, hydrangea berry spray, tulip stem, tulip bud -->
      <g :id="`${uid}-sprig`">
        <path d="M0,0 Q10,-64 4,-132" fill="none" stroke="var(--color-leaf-deep)" stroke-width="3" />
        <use :href="ref_('lf1')" transform="translate(7,-32) rotate(48) scale(0.55)" />
        <use :href="ref_('lf2')" transform="translate(7,-38) rotate(-42) scale(0.5)" />
        <use :href="ref_('lf1')" transform="translate(9,-72) rotate(52) scale(0.5)" />
        <use :href="ref_('lf2')" transform="translate(9,-78) rotate(-46) scale(0.45)" />
        <use :href="ref_('lf3')" transform="translate(7,-108) rotate(34) scale(0.42)" />
        <use :href="ref_('lf1')" transform="translate(5,-130) rotate(-8) scale(0.44)" />
      </g>
      <g :id="`${uid}-berry`">
        <path d="M0,0 Q-7,-28 -16,-46 M0,0 Q3,-26 12,-44 M0,0 Q-1,-22 -2,-50" fill="none" stroke="var(--color-leaf-deep)" stroke-width="2" />
        <circle cx="-16" cy="-48" r="5.5" fill="var(--color-petal)" />
        <circle cx="12" cy="-46" r="5.5" fill="var(--color-petal-mid)" />
        <circle cx="-2" cy="-52" r="5.5" fill="var(--color-petal-soft)" />
      </g>
      <g :id="`${uid}-tstem`">
        <path d="M0,0 Q6,-70 2,-138" fill="none" stroke="var(--color-leaf-deep)" stroke-width="3" />
        <use :href="ref_('tlf')" transform="translate(2,-8) rotate(30) scale(0.9)" />
        <use :href="ref_('tlf')" transform="translate(3,-14) rotate(-24) scale(0.8)" />
        <use :href="ref_('tcup')" transform="translate(2,-150) scale(0.8)" />
      </g>
      <g :id="`${uid}-bud`">
        <path d="M0,0 Q3,-24 0,-44" fill="none" stroke="var(--color-leaf-deep)" stroke-width="2.5" />
        <g transform="translate(0,-46)">
          <use :href="ref_('tpB')" transform="rotate(-14) scale(0.55)" />
          <use :href="ref_('tpB')" transform="rotate(14) scale(0.55)" />
          <use :href="ref_('tpC')" transform="scale(0.5)" />
        </g>
        <use :href="ref_('tlf')" transform="translate(0,-2) rotate(56) scale(0.4)" />
      </g>
    </defs>

    <g class="sway sway-a">
      <use :href="ref_('sprig')" transform="rotate(-38) scale(1.5)" />
      <use :href="ref_('sprig')" transform="rotate(30) scale(1.25)" />
      <use :href="ref_('sprig')" transform="rotate(-4) scale(1.4)" />
      <use :href="ref_('berry')" transform="rotate(66) scale(1.3)" />
      <use :href="ref_('berry')" transform="rotate(-64) scale(1.2)" />
      <use :href="ref_('tstem')" transform="rotate(-8) scale(1.05)" />
      <use :href="ref_('bud')" transform="rotate(20) scale(1.15)" />
    </g>
    <g class="sway sway-b">
      <use :href="ref_('bloomX')" transform="translate(-54,-66) scale(1.15)" />
      <use :href="ref_('bloomX')" transform="translate(36,-104) scale(0.9)" />
      <use :href="ref_('bloomX')" transform="translate(-12,-30) scale(0.68)" />
      <use :href="ref_('bloomX')" transform="translate(66,-34) scale(0.6)" />
      <use :href="ref_('bloomX')" transform="translate(-24,-150) scale(0.58)" />
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
