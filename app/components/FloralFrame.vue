<script setup lang="ts">
// Decorative photo frame: clip-path mask on the slotted image plus SVG
// floral garlands drawn with the same shape language as FloralCluster.
const props = withDefaults(defineProps<{ variant?: 'arch' | 'oval' | 'circle' }>(), { variant: 'arch' })

const clip: Record<'arch' | 'oval' | 'circle', string> = {
  arch: 'inset(0 round 999px 999px 1.5rem 1.5rem)',
  oval: 'ellipse(50% 50% at 50% 50%)',
  circle: 'circle(50% at 50% 50%)',
}

const uid = useId()
const ref_ = (name: string) => `#${uid}-${name}`

// One garland (two vine arms at 90° + bloom cluster at the joint) is placed
// at four points, rotated so the arms hug the photo's edges. The arch has
// real bottom corners but a curved top, so its top garlands sit on the arch
// curve; oval/circle have no corners at all, so all four sit at the 45°
// tangent points. x/y are percentages of the frame box (the joint's centre).
interface Corner { x: number, y: number, rot: number, size: 'lg' | 'sm', anim: 'a' | 'b' }
const corners = computed<Corner[]>(() => props.variant === 'arch'
  ? [
      { x: 0, y: 100, rot: 0, size: 'lg', anim: 'a' },
      { x: 91, y: 9, rot: 180, size: 'lg', anim: 'b' },
      { x: 9, y: 9, rot: 90, size: 'sm', anim: 'b' },
      { x: 100, y: 100, rot: -90, size: 'sm', anim: 'a' },
    ]
  : [
      { x: 13, y: 87, rot: 0, size: 'lg', anim: 'a' },
      { x: 87, y: 13, rot: 180, size: 'lg', anim: 'b' },
      { x: 13, y: 13, rot: 90, size: 'sm', anim: 'b' },
      { x: 87, y: 87, rot: -90, size: 'sm', anim: 'a' },
    ])
</script>

<template>
  <div class="floral-frame relative inline-block">
    <div class="overflow-hidden" :style="{ clipPath: clip[variant] }">
      <slot />
    </div>

    <!-- shared defs; ids resolve document-wide, so the corner svgs reuse them -->
    <svg aria-hidden="true" class="absolute h-0 w-0" fill="none">
      <defs>
        <path :id="`${uid}-petal`" d="M0,2 C-6,-2 -7,-13 0,-18 C7,-13 6,-2 0,2 Z" />
        <path :id="`${uid}-petal-wide`" d="M0,3 C-9,-1 -10,-15 0,-21 C10,-15 9,-1 0,3 Z" />
        <path :id="`${uid}-leaf`" d="M0,0 C-6,-6 -7,-19 0,-29 C7,-19 6,-6 0,0 Z" />
        <g :id="`${uid}-bloom`">
          <use v-for="i in 8" :key="i" :href="ref_('petal')" :transform="`rotate(${(i - 1) * 45})`" fill="var(--color-petal-soft)" />
          <use v-for="i in 8" :key="`m${i}`" :href="ref_('petal')" :transform="`rotate(${(i - 1) * 45 + 22.5}) scale(0.6)`" fill="var(--color-petal)" />
          <circle r="3" fill="var(--color-gold)" />
        </g>
        <g :id="`${uid}-bloom5`">
          <use v-for="i in 5" :key="i" :href="ref_('petal-wide')" :transform="`rotate(${(i - 1) * 72})`" fill="var(--color-petal-mid)" />
          <use v-for="i in 5" :key="`s${i}`" :href="ref_('petal-wide')" :transform="`rotate(${(i - 1) * 72 + 36}) scale(0.55)`" fill="var(--color-petal-soft)" />
          <circle r="4" fill="var(--color-gold)" />
          <circle cy="-6" r="1.4" fill="var(--color-gold-soft)" />
          <circle cx="5" cy="3" r="1.4" fill="var(--color-gold-soft)" />
          <circle cx="-5" cy="3" r="1.4" fill="var(--color-gold-soft)" />
        </g>
        <g :id="`${uid}-bud`">
          <path d="M0,0 Q2,-14 0,-24" stroke="var(--color-leaf-deep)" stroke-width="1.6" />
          <g transform="translate(0,-25)">
            <use :href="ref_('petal')" transform="scale(0.55)" fill="var(--color-petal)" />
            <use :href="ref_('petal')" transform="rotate(-32) scale(0.48)" fill="var(--color-petal-mid)" />
            <use :href="ref_('petal')" transform="rotate(32) scale(0.48)" fill="var(--color-petal-mid)" />
          </g>
          <use :href="ref_('leaf')" transform="translate(0,-2) rotate(58) scale(0.32)" fill="var(--color-leaf)" />
        </g>
        <g :id="`${uid}-berry`">
          <path d="M0,0 Q-4,-16 -9,-26 M0,0 Q2,-15 7,-25 M0,0 Q-1,-13 -1,-28" stroke="var(--color-leaf-deep)" stroke-width="1.3" />
          <circle cx="-9" cy="-27" r="3" fill="var(--color-petal)" />
          <circle cx="7" cy="-26" r="3" fill="var(--color-petal-deep)" />
          <circle cx="-1" cy="-29" r="3" fill="var(--color-petal-mid)" />
        </g>
        <!-- leafy vine running along +x, hugging an edge -->
        <g :id="`${uid}-vine`">
          <path d="M0,0 Q28,-10 55,-6 T108,-10 T150,-8" stroke="var(--color-leaf-deep)" stroke-width="2" />
          <use :href="ref_('leaf')" transform="translate(14,-6) rotate(48) scale(0.55)" fill="var(--color-leaf)" />
          <use :href="ref_('leaf')" transform="translate(27,-8) rotate(142) scale(0.45)" fill="var(--color-leaf-soft)" />
          <use :href="ref_('leaf')" transform="translate(41,-6) rotate(55) scale(0.52)" fill="var(--color-leaf-soft)" />
          <use :href="ref_('bloom5')" transform="translate(58,-8) scale(0.5)" />
          <use :href="ref_('leaf')" transform="translate(72,-8) rotate(132) scale(0.42)" fill="var(--color-leaf)" />
          <use :href="ref_('leaf')" transform="translate(85,-8) rotate(48) scale(0.48)" fill="var(--color-leaf)" />
          <use :href="ref_('berry')" transform="translate(96,-8) rotate(65) scale(0.8)" />
          <use :href="ref_('bloom5')" transform="translate(112,-9) scale(0.38)" />
          <use :href="ref_('leaf')" transform="translate(124,-8) rotate(140) scale(0.42)" fill="var(--color-leaf-soft)" />
          <use :href="ref_('leaf')" transform="translate(136,-8) rotate(52) scale(0.45)" fill="var(--color-leaf)" />
          <use :href="ref_('bud')" transform="translate(148,-9) rotate(80) scale(0.9)" />
        </g>
        <!-- corner garland: two vine arms along the edges + bloom cluster at the joint -->
        <g :id="`${uid}-garland`">
          <use :href="ref_('vine')" />
          <use :href="ref_('vine')" transform="rotate(-90)" />
          <use :href="ref_('berry')" transform="translate(-22,-8) rotate(-55)" />
          <use :href="ref_('berry')" transform="translate(14,-24) rotate(30)" />
          <use :href="ref_('bud')" transform="translate(32,-2) rotate(45)" />
          <use :href="ref_('bud')" transform="translate(-4,-34) rotate(-40)" />
          <use :href="ref_('bloom5')" transform="translate(19,-16) scale(0.72)" />
          <use :href="ref_('bloom5')" transform="translate(-15,-23) scale(0.6)" />
          <use :href="ref_('bloom')" transform="scale(1.15)" />
        </g>
      </defs>
    </svg>

    <!-- rotation lives on an inner attribute (not a class) because the scroll
         animation's transform would override a class transform on the svg -->
    <div
      v-for="(c, i) in corners"
      :key="i"
      class="pointer-events-none absolute"
      :style="{ left: `${c.x}%`, top: `${c.y}%`, transform: 'translate(-50%, -50%)' }"
    >
      <svg
        aria-hidden="true"
        viewBox="-125 -125 250 250"
        fill="none"
        class="frame-floral overflow-visible"
        :class="[c.anim === 'a' ? 'frame-floral-a' : 'frame-floral-b', c.size === 'lg' ? 'w-72' : 'w-40']"
      >
        <use :href="ref_('garland')" :transform="`rotate(${c.rot})${c.size === 'sm' ? ' scale(0.85)' : ''}`" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.frame-floral {
  transform-origin: center;
}

/* Slow twist driven by scroll position; static frame when the visitor
   prefers reduced motion or the browser lacks scroll-driven animations. */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .frame-floral-a,
    .frame-floral-b {
      animation: frame-twist linear both;
      animation-timeline: view();
      animation-range: entry 0% exit 100%;
    }

    .frame-floral-b {
      animation-name: frame-twist-reverse;
    }
  }
}

@keyframes frame-twist {
  from {
    transform: rotate(-4deg);
  }

  to {
    transform: rotate(5deg);
  }
}

@keyframes frame-twist-reverse {
  from {
    transform: rotate(3deg);
  }

  to {
    transform: rotate(-5deg);
  }
}
</style>
