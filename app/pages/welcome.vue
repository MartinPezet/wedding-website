<script setup lang="ts">
const { loggedIn, fetch: refreshSession } = useUserSession()
const password = ref('')
const error = ref('')
const pending = ref(false)
// set when an invite QR/link didn't match — keep copy friendly and generic
const inviteFallback = computed(() => 'invite' in useRoute().query)

if (loggedIn.value) {
  await navigateTo('/')
}

async function submit() {
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/gate', { method: 'POST', body: { password: password.value } })
    await refreshSession()
    await navigateTo('/')
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

useSeoMeta({
  title: 'Ciera & Martin',
  description: 'Ciera and Martin are getting married — enter the password from your invitation to see the details.',
  ogTitle: 'Ciera & Martin are getting married',
  ogDescription: 'Enter the password from your invitation to see the details.',
  ogImage: '/og.png',
})
</script>

<template>
  <section class="pt-24 text-center sm:pt-36">
    <p class="text-sm uppercase tracking-widest text-petal-deep">Welcome</p>
    <h1 class="mt-4 text-5xl text-ink sm:text-6xl">Ciera &amp; Martin</h1>
    <p v-if="inviteFallback" class="mt-6 text-leaf-deep">
      Hmm, that link didn't quite work — no worries! Just enter the password from your invitation below.
    </p>
    <p v-else class="mt-6 text-leaf-deep">Enter the password from your invitation.</p>

    <form class="mx-auto mt-8 flex max-w-xs flex-col gap-3" @submit.prevent="submit">
      <input
        v-model="password"
        type="password"
        name="password"
        autocomplete="current-password"
        required
        placeholder="Password"
        class="rounded-full border border-leaf/40 bg-white/70 px-5 py-3 text-center text-ink placeholder:text-leaf/60 focus:border-petal focus:outline-none"
      >
      <button
        type="submit"
        :disabled="pending"
        class="rounded-full bg-leaf-deep px-5 py-3 font-display text-cream transition hover:bg-leaf disabled:opacity-60"
      >
        {{ pending ? 'Checking…' : 'Come on in' }}
      </button>
      <p v-if="error" class="text-sm text-petal" role="alert">{{ error }}</p>
    </form>
  </section>
</template>
