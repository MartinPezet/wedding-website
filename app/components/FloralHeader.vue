<template>
  <!-- corner clusters fan into the page from the top edge, as in mockup 1a;
       smaller on mobile so content stays clear -->
  <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 z-0">
    <FloralCluster class="absolute left-0 top-0 w-56 -translate-x-1/2 -translate-y-1/2 rotate-[135deg] sm:w-96" />
    <FloralCluster class="absolute right-0 top-0 w-56 -translate-y-1/2 translate-x-1/2 -rotate-[135deg] sm:w-96" />
  </div>
</template>
