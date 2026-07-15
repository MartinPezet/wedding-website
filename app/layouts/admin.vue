<script setup lang="ts">
const { fetch: refreshSession } = useUserSession()

async function logout() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  await refreshSession()
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="sticky top-0 z-50 border-b border-ink/10 bg-cream/80 backdrop-blur-md">
      <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <NuxtLink to="/admin" class="font-display text-xl text-ink">Wedding HQ</NuxtLink>
        <nav class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm uppercase tracking-widest text-leaf-deep">
          <NuxtLink to="/admin" class="hover:text-petal" exact-active-class="text-petal-deep">Dashboard</NuxtLink>
          <NuxtLink to="/admin/seating" class="hover:text-petal" exact-active-class="text-petal-deep">Seating</NuxtLink>
          <NuxtLink to="/admin/print" class="hover:text-petal" active-class="text-petal-deep">Print</NuxtLink>
          <NuxtLink to="/admin/import" class="hover:text-petal" exact-active-class="text-petal-deep">Import</NuxtLink>
          <NuxtLink to="/admin/settings" class="hover:text-petal" exact-active-class="text-petal-deep">Settings</NuxtLink>
        </nav>
        <div class="ms-auto flex items-center gap-4 text-sm">
          <NuxtLink to="/" class="text-leaf-deep hover:text-petal">View site</NuxtLink>
          <button type="button" class="text-petal-deep hover:text-petal" @click="logout">Log out</button>
        </div>
      </div>
    </header>
    <main class="mx-auto w-full max-w-5xl grow px-4 pb-12 pt-6">
      <slot />
    </main>
  </div>
</template>
