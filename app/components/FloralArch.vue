<script setup lang="ts">
// Hero photo treatment (mockup 2a): clips the slotted photo and crowns it with
// a floral arch — leaves + hydrangea blooms on a semicircle over the top edge,
// tulip stems springing from the base (arch variant only). Replaces FloralFrame
// on the / and /gifts heroes. All fills route through theme tokens; the garland
// reveals with a bloom-in on load and is static under reduced motion.
withDefaults(defineProps<{ variant?: 'arch' | 'circle' }>(), { variant: 'arch' })

const clip: Record<'arch' | 'circle', string> = {
  arch: 'inset(0 round 999px 999px 1.5rem 1.5rem)',
  circle: 'circle(50% at 50% 50%)',
}

const uid = useId()
const ref_ = (name: string) => `#${uid}-${name}`
</script>

<template>
  <div class="floral-arch relative inline-block">
    <div class="overflow-hidden" :style="{ clipPath: clip[variant] }">
      <slot />
    </div>

    <!-- crowning garland: lifted above the photo, scaled to its width -->
    <svg
      aria-hidden="true"
      class="floral-arch-garland pointer-events-none absolute left-1/2 top-0 overflow-visible"
      :class="variant === 'arch' ? 'w-[124%]' : 'w-[116%]'"
      :viewBox="variant === 'arch' ? '-40 -45 410 510' : '-40 -45 410 300'"
      fill="none"
      preserveAspectRatio="xMidYMin meet"
      :style="{ transform: variant === 'arch' ? 'translate(-50%, -11%)' : 'translate(-50%, -22%)' }"
    >
      <defs>
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
        <path :id="`${uid}-lf1`" d="M0,0 C-15,-10 -17,-36 0,-54 C17,-36 15,-10 0,0 Z" fill="var(--color-leaf)" />
        <path :id="`${uid}-lf2`" d="M0,0 C-15,-10 -17,-36 0,-54 C17,-36 15,-10 0,0 Z" fill="var(--color-leaf-soft)" />
        <path :id="`${uid}-lf3`" d="M0,0 C-15,-10 -17,-36 0,-54 C17,-36 15,-10 0,0 Z" fill="var(--color-leaf-deep)" />
        <path :id="`${uid}-tlf`" d="M0,0 C-7,-16 -8,-52 0,-80 C8,-52 7,-16 0,0 Z" fill="var(--color-leaf)" />
        <path :id="`${uid}-tpA`" d="M0,4 C-11,-2 -12,-26 0,-34 C12,-26 11,-2 0,4 Z" fill="var(--color-tulip)" />
        <path :id="`${uid}-tpB`" d="M0,4 C-11,-2 -12,-26 0,-34 C12,-26 11,-2 0,4 Z" fill="var(--color-tulip-mid)" />
        <path :id="`${uid}-tpC`" d="M0,4 C-11,-2 -12,-26 0,-34 C12,-26 11,-2 0,4 Z" fill="var(--color-tulip-deep)" />
        <g :id="`${uid}-tcup`">
          <use :href="ref_('tpB')" transform="translate(-9,16) rotate(-22)" />
          <use :href="ref_('tpB')" transform="translate(9,16) rotate(22)" />
          <use :href="ref_('tpC')" transform="translate(-4,17) rotate(-8) scale(0.92)" />
          <use :href="ref_('tpA')" transform="translate(0,16) scale(1.04)" />
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

      <g class="arch-reveal">
        <path d="M-6,164 A175,175 0 0 1 336,164" stroke="var(--color-leaf-deep)" stroke-width="2.5" />
        <use :href="ref_('lf1')" transform="translate(-6,164) rotate(-155) scale(0.55)" />
        <use :href="ref_('lf1')" transform="translate(-3,152) rotate(-119) scale(0.5)" />
        <use :href="ref_('lf2')" transform="translate(3,133) rotate(158) scale(0.45)" />
        <use :href="ref_('lf1')" transform="translate(12,115) rotate(-106) scale(0.5)" />
        <use :href="ref_('lf3')" transform="translate(23,98) rotate(170) scale(0.45)" />
        <use :href="ref_('lf2')" transform="translate(35,83) rotate(-93) scale(0.5)" />
        <use :href="ref_('lf1')" transform="translate(49,69) rotate(-177) scale(0.45)" />
        <use :href="ref_('lf3')" transform="translate(65,57) rotate(-80) scale(0.5)" />
        <use :href="ref_('lf2')" transform="translate(82,46) rotate(-164) scale(0.45)" />
        <use :href="ref_('lf1')" transform="translate(99,38) rotate(-67) scale(0.5)" />
        <use :href="ref_('lf3')" transform="translate(118,31) rotate(-151) scale(0.45)" />
        <use :href="ref_('lf3')" transform="translate(212,31) rotate(151) scale(0.45)" />
        <use :href="ref_('lf1')" transform="translate(231,38) rotate(67) scale(0.5)" />
        <use :href="ref_('lf2')" transform="translate(248,46) rotate(164) scale(0.45)" />
        <use :href="ref_('lf3')" transform="translate(265,57) rotate(80) scale(0.5)" />
        <use :href="ref_('lf1')" transform="translate(281,69) rotate(177) scale(0.45)" />
        <use :href="ref_('lf2')" transform="translate(295,83) rotate(93) scale(0.5)" />
        <use :href="ref_('lf3')" transform="translate(307,98) rotate(-170) scale(0.45)" />
        <use :href="ref_('lf1')" transform="translate(318,115) rotate(106) scale(0.5)" />
        <use :href="ref_('lf2')" transform="translate(327,133) rotate(-158) scale(0.45)" />
        <use :href="ref_('lf1')" transform="translate(333,152) rotate(119) scale(0.5)" />
        <use :href="ref_('lf1')" transform="translate(336,164) rotate(155) scale(0.55)" />
        <use :href="ref_('flb')" transform="translate(20,104) rotate(-30) scale(0.7)" />
        <use :href="ref_('bloomX')" transform="translate(1,140) rotate(-24) scale(0.44)" />
        <use :href="ref_('bloomX')" transform="translate(46,73) rotate(-15) scale(0.4)" />
        <use :href="ref_('flc')" transform="translate(84,46) rotate(45) scale(0.75)" />
        <use :href="ref_('bloomX')" transform="translate(116,32) rotate(-8) scale(0.46)" />
        <use :href="ref_('bloomX')" transform="translate(165,19) rotate(4) scale(0.52)" />
        <use :href="ref_('bloomX')" transform="translate(214,32) rotate(12) scale(0.46)" />
        <use :href="ref_('flc')" transform="translate(246,46) rotate(-35) scale(0.75)" />
        <use :href="ref_('bloomX')" transform="translate(284,73) rotate(20) scale(0.4)" />
        <use :href="ref_('bloomX')" transform="translate(329,140) rotate(24) scale(0.44)" />
        <use :href="ref_('fla')" transform="translate(310,104) rotate(30) scale(0.7)" />
        <template v-if="variant === 'arch'">
          <g transform="translate(20,446)">
            <use :href="ref_('tstem')" transform="rotate(-14) scale(0.7)" />
            <use :href="ref_('tstem')" transform="translate(-16,2) rotate(-30) scale(0.52)" />
            <use :href="ref_('bud')" transform="translate(16,0) rotate(10) scale(0.62)" />
          </g>
          <g transform="translate(310,446)">
            <use :href="ref_('tstem')" transform="rotate(14) scale(0.7)" />
            <use :href="ref_('tstem')" transform="translate(16,2) rotate(30) scale(0.52)" />
            <use :href="ref_('bud')" transform="translate(-16,0) rotate(-10) scale(0.62)" />
          </g>
        </template>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.arch-reveal {
  transform-box: fill-box;
  transform-origin: 50% 60%;
}

@media (prefers-reduced-motion: no-preference) {
  .arch-reveal {
    animation: arch-bloom-in 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both;
  }
}

@keyframes arch-bloom-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }

  62% {
    transform: scale(1.08);
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
