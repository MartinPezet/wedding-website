<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Add party — Wedding HQ', robots: 'noindex' })

const name = ref('')
const guests = ref<{ name: string, isChild: boolean, phone: string }[]>([
  { name: '', isChild: false, phone: '' },
])
const error = ref('')
const pending = ref(false)

function addGuest() {
  guests.value.push({ name: '', isChild: false, phone: '' })
}

function removeGuest(index: number) {
  guests.value.splice(index, 1)
}

async function submit() {
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/parties', {
      method: 'POST',
      body: {
        name: name.value,
        guests: guests.value.map(guest => ({
          name: guest.name,
          isChild: guest.isChild,
          phone: guest.phone || undefined,
        })),
      },
    })
    await navigateTo('/admin')
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
  <section class="max-w-xl">
    <h1 class="font-display text-3xl text-ink">Add party</h1>
    <form class="mt-4 flex flex-col gap-4" @submit.prevent="submit">
      <label class="flex flex-col gap-1 text-sm text-leaf-deep">
        Party name
        <input v-model="name" name="name" required class="rounded-lg border border-leaf/40 bg-white/70 px-3 py-2 text-ink">
      </label>

      <fieldset class="flex flex-col gap-3">
        <legend class="text-sm text-leaf-deep">Guests</legend>
        <div v-for="(guest, index) in guests" :key="index" class="flex flex-wrap items-center gap-2 rounded-lg border border-ink/10 bg-white/70 p-3">
          <input v-model="guest.name" :name="`guest-name-${index}`" required placeholder="Name" class="min-w-40 grow rounded-lg border border-leaf/40 px-3 py-1.5 text-ink">
          <input v-model="guest.phone" :name="`guest-phone-${index}`" type="tel" placeholder="Phone (optional)" class="w-44 rounded-lg border border-leaf/40 px-3 py-1.5 text-ink">
          <label class="flex items-center gap-1 text-sm text-ink">
            <input v-model="guest.isChild" :name="`guest-child-${index}`" type="checkbox"> Child
          </label>
          <button v-if="guests.length > 1" type="button" class="text-sm text-petal-deep" @click="removeGuest(index)">Remove</button>
        </div>
        <button type="button" class="self-start text-sm text-leaf-deep underline" @click="addGuest">+ Add guest</button>
      </fieldset>

      <div class="flex items-center gap-3">
        <button type="submit" :disabled="pending" class="rounded-full bg-leaf-deep px-5 py-2 text-cream hover:bg-leaf disabled:opacity-60">
          {{ pending ? 'Saving…' : 'Create party' }}
        </button>
        <NuxtLink to="/admin" class="text-sm text-ink/60 hover:text-ink">Cancel</NuxtLink>
      </div>
      <p v-if="error" class="text-sm text-petal" role="alert">{{ error }}</p>
    </form>
  </section>
</template>
