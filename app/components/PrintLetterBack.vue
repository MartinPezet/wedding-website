<script lang="ts">
// Geometry for the decorative A5 verso. Lives in a plain <script> so it is
// evaluated once per module rather than once per letter — the batch print page
// mounts one of these per party.
export const sheet = { w: 720, h: 1008 }
export const centre = { x: sheet.w / 2, y: sheet.h / 2 }
// |x/a|^n + |y/b|^n = 1 — n=2 is an ellipse, n=4 the squircle, higher is boxier
const ring = { a: 300, b: 440, n: 4 }
// Each kind is spread evenly around the curve on its own count, so leaf density
// can change without disturbing the flowers. Buds sit midway between mopheads.
// Keep LEAVES a multiple of 4 so the alternating flanks mirror on both axes.
const MOPHEADS = 18
const BUDS = 18
const LEAVES = 180
// every piece rides this, so the whole garland resizes from one number
const PIECE_SCALE = 1.5
// leaves ride this on top, to size the foliage against the flowers
const LEAF_SCALE = 0.8

/** superellipse point at parameter t */
const point = (t: number) => {
  const p = 2 / ring.n
  const c = Math.cos(t)
  const s = Math.sin(t)
  return {
    x: Math.sign(c) * Math.abs(c) ** p * ring.a,
    y: Math.sign(s) * Math.abs(s) ** p * ring.b,
  }
}

/** degrees to rotate art that points "up" so it faces out of the curve */
const outward = (x: number, y: number) => {
  const gx = (Math.sign(x) * Math.abs(x / ring.a) ** (ring.n - 1)) / ring.a
  const gy = (Math.sign(y) * Math.abs(y / ring.b) ** (ring.n - 1)) / ring.b
  return (Math.atan2(gx, -gy) * 180) / Math.PI
}

// even parameter steps bunch up round the corners, so walk the curve once and
// resample by arc length — that even spacing is what stops it reading as clutter
const FINE = 480
const fine = Array.from({ length: FINE + 1 }, (_, i) => point((i / FINE) * Math.PI * 2))
const run: number[] = [0]
for (let i = 1; i <= FINE; i++) {
  run.push(run[i - 1]! + Math.hypot(fine[i]!.x - fine[i - 1]!.x, fine[i]!.y - fine[i - 1]!.y))
}
const total = run[FINE]!

/** point a given distance along the curve */
const along = (dist: number) => {
  const d = ((dist % total) + total) % total
  let i = 1
  while (i < FINE && run[i]! < d) i++
  const span = run[i]! - run[i - 1]!
  const f = span === 0 ? 0 : (d - run[i - 1]!) / span
  const p0 = fine[i - 1]!
  const p1 = fine[i]!
  return { x: p0.x + (p1.x - p0.x) * f, y: p0.y + (p1.y - p0.y) * f }
}

const r1 = (v: number) => Math.round(v * 10) / 10
const r2 = (v: number) => Math.round(v * 100) / 100
const path = Array.from({ length: 121 }, (_, i) => {
  const p = along((i / 120) * total)
  return `${r1(p.x)},${r1(p.y)}`
}).join('L')
export const ringPath = `M${path}Z`

const leafTints = ['lf1', 'lf2', 'lf3'] as const
const floretTints = ['fla', 'flb', 'flc'] as const

export interface Piece { href: string, transform: string }
// art points "up", so `outward` alone aims a piece straight out of the curve;
// the branch runs at outward±90, so a leaf swept 45° off it sits at outward-45
// on the outer flank and outward+225 on the inner.
// Leaves and flowers come back as separate lists purely for paint order: SVG
// paints in document order, so the leaves go down first and the flowers sit on
// top of them.
const garland = (() => {
  const leaves: Piece[] = []
  const flowers: Piece[] = []
  /** a piece sitting `dist` along the curve, turned `rot` off the outward normal */
  const at = (dist: number, name: string, rot: number, scale: number): Piece => {
    const p = along(dist)
    const angle = outward(p.x, p.y)
    return {
      href: name,
      transform: `translate(${r1(p.x)},${r1(p.y)}) rotate(${r1(angle + rot)}) scale(${r2(scale * PIECE_SCALE)})`,
    }
  }
  // leaves alternate flank so the run staggers the way they sit on a real stem;
  // the jitter keeps it off a machined herringbone
  for (let k = 0; k < LEAVES; k++) {
    const outer = k % 2 === 0
    const jitter = ((k % 5) - 2) * 4 * (outer ? 1 : -1)
    const scale = (k % 3 === 0 ? 0.46 : k % 3 === 1 ? 0.5 : 0.44) * LEAF_SCALE
    leaves.push(at((k / LEAVES) * total, leafTints[k % 3]!, (outer ? -45 : 225) + jitter, scale))
  }
  for (let k = 0; k < MOPHEADS; k++) {
    flowers.push(at((k / MOPHEADS) * total, 'bloomX', 0, k % 2 === 0 ? 0.52 : 0.46))
  }
  for (let k = 0; k < BUDS; k++) {
    flowers.push(at(((k + 0.5) / BUDS) * total, floretTints[k % 3]!, 0, 0.55))
  }
  return { leaves, flowers }
})()

export const leaves = garland.leaves
export const flowers = garland.flowers
</script>

<script setup lang="ts">
// Decorative A5 verso for the RSVP invite letter: a floral squircle framing a
// C&M monogram over a divider, inside a double inset hairline border.
// The garland rides a superellipse rather than the arch's circular arc, but
// keeps the arch's vocabulary and construction — uid-scoped <defs> primitives
// instanced with <use>, theme-token fills, reveal gated on reduced motion.
const uid = useId()
const ref_ = (name: string) => `#${uid}-${name}`
</script>

<template>
  <PrintPage size="a5">
    <template #bleed>
      <div data-letter-back class="absolute inset-0">
        <svg
          class="absolute inset-0 h-full w-full"
          :viewBox="`0 0 ${sheet.w} ${sheet.h}`"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          aria-hidden="true"
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
          </defs>

          <!-- the reveal animates CSS transform, which would override a transform
               attribute on the same node — so the centring lives on an inner group -->
          <g class="back-reveal">
            <g :transform="`translate(${centre.x},${centre.y})`">
              <path :d="ringPath" stroke="var(--color-leaf-deep)" stroke-width="1.6" />
              <!-- leaves first so the flowers paint over them -->
              <use
                v-for="(piece, i) in leaves"
                :key="`leaf-${i}`"
                :href="ref_(piece.href)"
                :transform="piece.transform"
              />
              <use
                v-for="(piece, i) in flowers"
                :key="`flower-${i}`"
                :href="ref_(piece.href)"
                :transform="piece.transform"
              />
            </g>
          </g>

          <!-- double inset hairline border -->
          <rect data-back-border x="180" y="188" width="360" height="632" stroke="color-mix(in srgb, var(--color-ink) 22%, transparent)" stroke-width="1" />
          <rect x="187" y="195" width="346" height="618" stroke="color-mix(in srgb, var(--color-ink) 12%, transparent)" stroke-width="1" />
        </svg>

        <!-- centred monogram over the divider -->
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-[5mm]">
          <div data-monogram class="whitespace-nowrap font-display text-[24mm] leading-none tracking-[0.02em] text-ink">
            C<span class="px-[1.5mm] font-light italic text-petal-deep">&amp;</span>M
          </div>
          <FloralDivider data-back-divider class="w-[30mm]" />
        </div>
      </div>
    </template>
  </PrintPage>
</template>

<style scoped>
.back-reveal {
  transform-box: fill-box;
  transform-origin: 50% 50%;
}

/* no fill-mode or delay: the resting state is the finished art, so printing
   before the preview's reveal has run can never drop the florals */
@media (prefers-reduced-motion: no-preference) {
  .back-reveal {
    animation: back-bloom-in 1.2s cubic-bezier(0.22, 1, 0.36, 1);
  }
}

@keyframes back-bloom-in {
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
