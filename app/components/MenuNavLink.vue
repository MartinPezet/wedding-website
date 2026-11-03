<script setup lang="ts">
// header link to the food-choice page, shown only while the admin has it open;
// mounted inside the signed-in nav, so /api/food never sees an anonymous call
const { data } = useFetch("/api/food", { pick: ["open"] });
</script>

<template>
  <NuxtLink
    v-if="data?.open"
    to="/menu"
    class="hover:text-petal"
    exact-active-class="text-petal-deep hover:text-petal-deep"
    >Menu</NuxtLink
  >
</template>
