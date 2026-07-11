<script setup lang="ts">
// Falling petals from the Claude Design mockup. There the count came from a
// DC editor prop (`petalCount`) rendered by <sc-for> — outside that runtime
// the template never expands, which is why the export shows no petals. Here
// it's a plain prop. Seeded LCG (same as the mockup) keeps SSR and client
// output identical, so no hydration mismatch.
const props = withDefaults(defineProps<{ count?: number }>(), { count: 20 });

const fills = [
  "var(--color-petal-soft)",
  "var(--color-petal-mid)",
  "var(--color-petal)",
];

const petals = computed(() => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: props.count }, (_, i) => ({
    left: (rnd() * 94 + 2).toFixed(1) + "%",
    dur: (10 + rnd() * 9).toFixed(1) + "s",
    delay: (-rnd() * 19).toFixed(1) + "s",
    rot: Math.round(rnd() * 360),
    size: Math.round(14 + rnd() * 12),
    fill: fills[i % fills.length]!,
  }));
});
</script>

<template>
  <div
    aria-hidden="true"
    class="petals pointer-events-none absolute inset-0 z-20 overflow-hidden"
  >
    <div
      v-for="(p, i) in petals"
      :key="i"
      class="petal"
      :style="{
        left: p.left,
        animationDuration: p.dur,
        animationDelay: p.delay,
      }"
    >
      <svg :width="p.size" :height="p.size" viewBox="-12 -12 24 24">
        <path
          d="M0,10 C-9,4 -10,-8 0,-11 C10,-8 9,4 0,10 Z"
          :fill="p.fill"
          opacity="0.7"
          :transform="`rotate(${p.rot})`"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* Off-screen unless animating — static fallback shows nothing, not a stuck petal. */
.petal {
  position: absolute;
  top: -70px;
}

@media (prefers-reduced-motion: no-preference) {
  .petal {
    animation: petal-fall linear infinite;
  }
}

@keyframes petal-fall {
  0% {
    transform: translate3d(0, -70px, 0) rotate(0deg);
    opacity: 0;
  }

  7% {
    opacity: 0.85;
  }

  55% {
    transform: translate3d(46px, 55vh, 0) rotate(170deg);
  }

  100% {
    transform: translate3d(-14px, 110vh, 0) rotate(340deg);
    opacity: 0;
  }
}
</style>
