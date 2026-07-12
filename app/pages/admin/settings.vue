<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Settings — Wedding HQ', robots: 'noindex' })

const { data } = await useFetch('/api/admin/settings')

const weddingDate = ref(data.value?.weddingDate?.slice(0, 10) ?? '')
const rsvpDeadline = ref(data.value?.rsvpDeadline?.slice(0, 10) ?? '')
const notice = ref('')
const error = ref('')
const pending = ref(false)

async function submit() {
  pending.value = true
  notice.value = ''
  error.value = ''
  try {
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: {
        weddingDate: weddingDate.value || undefined,
        // deadline day is inclusive — lock at the end of it
        rsvpDeadline: rsvpDeadline.value ? `${rsvpDeadline.value}T23:59:59Z` : undefined,
      },
    })
    notice.value = 'Settings saved — live immediately.'
  }
  catch (err) {
    error.value = (err as { data?: { message?: string } }).data?.message ?? 'Something went wrong.'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="max-w-md">
    <h1 class="font-display text-3xl text-ink">Settings</h1>
    <form class="mt-4 flex flex-col gap-4" @submit.prevent="submit">
      <label class="flex flex-col gap-1 text-sm text-leaf-deep">
        Wedding date
        <input v-model="weddingDate" name="weddingDate" type="date" class="rounded-lg border border-leaf/40 bg-white/70 px-3 py-2 text-ink">
      </label>
      <label class="flex flex-col gap-1 text-sm text-leaf-deep">
        RSVP deadline
        <input v-model="rsvpDeadline" name="rsvpDeadline" type="date" class="rounded-lg border border-leaf/40 bg-white/70 px-3 py-2 text-ink">
      </label>
      <button type="submit" :disabled="pending" class="self-start rounded-full bg-leaf-deep px-5 py-2 text-cream hover:bg-leaf disabled:opacity-60">
        {{ pending ? 'Saving…' : 'Save settings' }}
      </button>
      <p v-if="notice" class="text-sm text-leaf-deep" role="status">{{ notice }}</p>
      <p v-if="error" class="text-sm text-petal" role="alert">{{ error }}</p>
    </form>
  </section>
</template>
