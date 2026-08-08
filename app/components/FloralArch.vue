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

/**
 * Garland placement, as data so the arrangement can be retuned by editing
 * numbers. Each entry grows from its own stem point rather than the group
 * scaling as a whole — a whole-group scale starts collapsed over the photo.
 */
interface Sprig { id: string, x: number, y: number, rotate: number, scale: number }

const leaves: Sprig[] = [
  { id: 'lf1', x: -6, y: 164, rotate: -155, scale: 0.55 },
  { id: 'lf1', x: -3, y: 152, rotate: -119, scale: 0.5 },
  { id: 'lf2', x: 3, y: 133, rotate: 158, scale: 0.45 },
  { id: 'lf1', x: 12, y: 115, rotate: -106, scale: 0.5 },
  { id: 'lf3', x: 23, y: 98, rotate: 170, scale: 0.45 },
  { id: 'lf2', x: 35, y: 83, rotate: -93, scale: 0.5 },
  { id: 'lf1', x: 49, y: 69, rotate: -177, scale: 0.45 },
  { id: 'lf3', x: 65, y: 57, rotate: -80, scale: 0.5 },
  { id: 'lf2', x: 82, y: 46, rotate: -164, scale: 0.45 },
  { id: 'lf1', x: 99, y: 38, rotate: -67, scale: 0.5 },
  { id: 'lf3', x: 118, y: 31, rotate: -151, scale: 0.45 },
  { id: 'lf3', x: 212, y: 31, rotate: 151, scale: 0.45 },
  { id: 'lf1', x: 231, y: 38, rotate: 67, scale: 0.5 },
  { id: 'lf2', x: 248, y: 46, rotate: 164, scale: 0.45 },
  { id: 'lf3', x: 265, y: 57, rotate: 80, scale: 0.5 },
  { id: 'lf1', x: 281, y: 69, rotate: 177, scale: 0.45 },
  { id: 'lf2', x: 295, y: 83, rotate: 93, scale: 0.5 },
  { id: 'lf3', x: 307, y: 98, rotate: -170, scale: 0.45 },
  { id: 'lf1', x: 318, y: 115, rotate: 106, scale: 0.5 },
  { id: 'lf2', x: 327, y: 133, rotate: -158, scale: 0.45 },
  { id: 'lf1', x: 333, y: 152, rotate: 119, scale: 0.5 },
  { id: 'lf1', x: 336, y: 164, rotate: 155, scale: 0.55 },
]

const blooms: Sprig[] = [
  { id: 'flb', x: 20, y: 104, rotate: -30, scale: 0.7 },
  { id: 'bloomX', x: 1, y: 140, rotate: -24, scale: 0.44 },
  { id: 'bloomX', x: 46, y: 73, rotate: -15, scale: 0.4 },
  { id: 'flc', x: 84, y: 46, rotate: 45, scale: 0.75 },
  { id: 'bloomX', x: 116, y: 32, rotate: -8, scale: 0.46 },
  { id: 'bloomX', x: 165, y: 19, rotate: 4, scale: 0.52 },
  { id: 'bloomX', x: 214, y: 32, rotate: 12, scale: 0.46 },
  { id: 'flc', x: 246, y: 46, rotate: -35, scale: 0.75 },
  { id: 'bloomX', x: 284, y: 73, rotate: 20, scale: 0.4 },
  { id: 'bloomX', x: 329, y: 140, rotate: 24, scale: 0.44 },
  { id: 'fla', x: 310, y: 104, rotate: 30, scale: 0.7 },
]

// the garland grows outward from the apex of the arc, so each sprig waits for
// the vine to reach it; blooms open a beat after the foliage around them
const APEX_X = 165
const HALF_SPAN = 171
const VINE_START_MS = 550
const VINE_TRAVEL_MS = 1250

const reachedAt = (x: number, extra = 0) =>
  Math.round(VINE_START_MS + (Math.abs(x - APEX_X) / HALF_SPAN) * VINE_TRAVEL_MS + extra)

const sprigStyle = (sprig: Sprig, extra = 0) => ({
  '--s': String(sprig.scale),
  '--d': `${reachedAt(sprig.x, extra)}ms`,
})

/** both tulips rise once the vine has finished travelling down to them */
const tulipStyle = (extra: number) => ({ '--d': `${VINE_START_MS + VINE_TRAVEL_MS + extra}ms` })
</script>

<template>
  <div class="floral-arch relative inline-block">
    <div class="floral-arch-photo overflow-hidden" :style="{ clipPath: clip[variant] }">
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

      <g class="garland">
        <!-- vine draws outward from the apex, so it never crosses the photo -->
        <path
          class="vine"
          pathLength="100"
          d="M165,26.202 A175,175 0 0 0 -6,164"
          stroke="var(--color-leaf-deep)"
          stroke-width="2.5"
        />
        <path
          class="vine"
          pathLength="100"
          d="M165,26.202 A175,175 0 0 1 336,164"
          stroke="var(--color-leaf-deep)"
          stroke-width="2.5"
        />

        <!-- placement lives on the wrapper so the CSS transform is free to animate -->
        <g
          v-for="(leaf, index) in leaves"
          :key="`leaf-${index}`"
          :transform="`translate(${leaf.x},${leaf.y}) rotate(${leaf.rotate})`"
        >
          <use :href="ref_(leaf.id)" class="sprout sprout-leaf" :style="sprigStyle(leaf)" />
        </g>

        <g
          v-for="(bloom, index) in blooms"
          :key="`bloom-${index}`"
          :transform="`translate(${bloom.x},${bloom.y}) rotate(${bloom.rotate})`"
        >
          <use :href="ref_(bloom.id)" class="sprout sprout-bloom" :style="sprigStyle(bloom, 180)" />
        </g>

        <template v-if="variant === 'arch'">
          <g transform="translate(20,446)">
            <g class="tulip-rise" :style="tulipStyle(0)">
              <use :href="ref_('tstem')" transform="rotate(-14) scale(0.7)" />
              <use :href="ref_('tstem')" transform="translate(-16,2) rotate(-30) scale(0.52)" />
              <use :href="ref_('bud')" transform="translate(16,0) rotate(10) scale(0.62)" />
            </g>
          </g>
          <g transform="translate(310,446)">
            <g class="tulip-rise" :style="tulipStyle(160)">
              <use :href="ref_('tstem')" transform="rotate(14) scale(0.7)" />
              <use :href="ref_('tstem')" transform="translate(16,2) rotate(30) scale(0.52)" />
              <use :href="ref_('bud')" transform="translate(-16,0) rotate(-10) scale(0.62)" />
            </g>
          </g>
        </template>
      </g>
    </svg>
  </div>
</template>

<style scoped>
/* Nothing here sets a hidden or collapsed state outside the media query, so a
   visitor with reduced motion gets the finished garland, drawn and full size. */

.sprout {
  transform-box: fill-box;
}

/* leaves grow from the stem they hang off; blooms open from their own middle */
.sprout-leaf {
  transform-origin: 50% 100%;
}

.sprout-bloom {
  transform-origin: 50% 50%;
}

.tulip-rise {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}

@media (prefers-reduced-motion: no-preference) {
  .floral-arch-photo {
    animation: photo-fade 1100ms ease-out both;
  }

  .vine {
    stroke-dasharray: 100;
    animation: vine-draw 1250ms cubic-bezier(0.33, 0.9, 0.4, 1) 550ms both;
  }

  .sprout {
    animation: sprout 900ms cubic-bezier(0.16, 0.85, 0.35, 1) var(--d) both;
  }

  .tulip-rise {
    animation: tulip-rise 1700ms cubic-bezier(0.16, 0.85, 0.35, 1) var(--d) both;
  }
}

@keyframes photo-fade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes vine-draw {
  from {
    stroke-dashoffset: 100;
  }

  to {
    stroke-dashoffset: 0;
  }
}

@keyframes sprout {
  from {
    transform: scale(0);
    opacity: 0;
  }

  to {
    transform: scale(var(--s));
    opacity: 1;
  }
}

/* Rises from the ground and sways upright, the way a stem settles. Scales on both
   axes: scaling height alone reads as the stem unfolding rather than growing. */
@keyframes tulip-rise {
  0% {
    transform: scale(0) rotate(-3deg);
    opacity: 0;
  }

  45% {
    opacity: 1;
  }

  70% {
    transform: scale(1) rotate(2deg);
  }

  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}
</style>
