<script setup lang="ts">
const { session, fetch: refreshSession } = useUserSession()
const password = ref('')
const error = ref('')
const pending = ref(false)

if (session.value?.admin) {
  await navigateTo('/admin')
}

async function submit() {
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { password: password.value } })
    await refreshSession()
    await navigateTo('/admin')
  }
  catch (err) {
    error.value
      = (err as { data?: { message?: string } }).data?.message
        ?? 'Something went wrong — please try again.'
  }
  finally {
    pending.value = false
  }
}

useSeoMeta({ title: 'Admin — Ciera & Martin', robots: 'noindex' })
</script>

<template>
  <section class="pt-24 text-center sm:pt-36">
    <p class="text-sm uppercase tracking-widest text-petal-deep">Admin</p>
    <h1 class="mt-4 text-4xl text-ink sm:text-5xl">Wedding HQ</h1>

    <form class="mx-auto mt-8 flex max-w-xs flex-col gap-3" @submit.prevent="submit">
      <input
        v-model="password"
        type="password"
        name="password"
        autocomplete="current-password"
        required
        placeholder="Admin password"
        class="rounded-full border border-leaf/40 bg-white/70 px-5 py-3 text-center text-ink placeholder:text-leaf/60 focus:border-petal focus:outline-none"
      >
      <button
        type="submit"
        :disabled="pending"
        class="rounded-full bg-leaf-deep px-5 py-3 font-display text-cream transition hover:bg-leaf disabled:opacity-60"
      >
        {{ pending ? 'Checking…' : 'Sign in' }}
      </button>
      <p v-if="error" class="text-sm text-petal" role="alert">{{ error }}</p>
    </form>
  </section>
</template>
