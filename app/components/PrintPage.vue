<script setup lang="ts">
// One paper sheet. Sizing + page-break behaviour live in print.css; this
// wrapper just picks the size class. Stack several for a batch document.
// #bleed content sits outside the body padding, so florals can run to the
// sheet edge (clipped there by .print-page's overflow); #default is padded.
export type PageSize = 'a5' | 'a4' | 'a4-landscape' | 'a2' | 'a2-landscape' | 'a1' | 'a1-landscape'
const props = withDefaults(defineProps<{ size?: PageSize }>(), { size: 'a5' })
const slots = useSlots()
</script>

<template>
  <div class="print-page" :class="`print-page-${props.size}`" data-print-page>
    <div v-if="slots.bleed" class="print-page-bleed pointer-events-none z-0" aria-hidden="true">
      <slot name="bleed" />
    </div>
    <div class="print-page-body relative z-10">
      <slot />
    </div>
  </div>
</template>
