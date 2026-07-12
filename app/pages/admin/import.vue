<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Import guests — Wedding HQ', robots: 'noindex' })

interface ImportRow {
  line: number
  party: string
  guest: string
  phone: string
  isChild: boolean
  errors: string[]
}

const csv = ref('')
const rows = ref<ImportRow[] | null>(null)
const error = ref('')
const notice = ref('')
const pending = ref(false)

const hasErrors = computed(() => (rows.value ?? []).some(row => row.errors.length > 0))

async function preview() {
  pending.value = true
  error.value = ''
  notice.value = ''
  try {
    const result = await $fetch<{ rows: ImportRow[] }>('/api/admin/import', {
      method: 'POST',
      body: { csv: csv.value },
    })
    rows.value = result.rows
  }
  catch (err) {
    error.value = (err as { data?: { message?: string } }).data?.message ?? 'Something went wrong.'
  }
  finally {
    pending.value = false
  }
}

async function confirmImport() {
  pending.value = true
  error.value = ''
  try {
    const result = await $fetch<{ created: number }>('/api/admin/import', {
      method: 'POST',
      body: { csv: csv.value, commit: true },
    })
    notice.value = `Imported ${result.created} ${result.created === 1 ? 'party' : 'parties'}.`
    rows.value = null
    csv.value = ''
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
  <section class="max-w-2xl">
    <h1 class="font-display text-3xl text-ink">Import guest list</h1>

    <div class="mt-4 rounded-xl border border-ink/10 bg-white/70 p-4 text-sm text-ink/80">
      <p>Paste CSV with a header row and these columns:</p>
      <pre class="mt-2 overflow-x-auto rounded-lg bg-ink/5 p-3 text-xs">party,guest,phone,child
The Smiths,Alice Smith,07911 123456,
The Smiths,Bob Smith,,
The Smiths,Sunny Smith,,yes</pre>
      <ul class="mt-2 list-disc space-y-1 ps-5">
        <li><strong>party</strong> — rows with the same party name become one invitation</li>
        <li><strong>guest</strong> — one row per guest</li>
        <li><strong>phone</strong> — optional contact number (first one becomes the party contact)</li>
        <li><strong>child</strong> — optional; <code>yes</code> marks a child (child menu)</li>
      </ul>
      <p class="mt-2">Import only adds new parties — existing parties are edited from the dashboard.</p>
    </div>

    <form class="mt-4 flex flex-col gap-3" @submit.prevent="preview">
      <textarea
        v-model="csv"
        name="csv"
        rows="8"
        required
        placeholder="party,guest,phone,child"
        class="w-full rounded-lg border border-leaf/40 bg-white/70 p-3 font-mono text-sm text-ink"
      />
      <button type="submit" :disabled="pending" class="self-start rounded-full bg-leaf-deep px-5 py-2 text-cream hover:bg-leaf disabled:opacity-60">
        {{ pending ? 'Working…' : 'Preview' }}
      </button>
    </form>

    <div v-if="rows" class="mt-6" data-testid="import-preview">
      <h2 class="font-display text-xl text-ink">Preview</h2>
      <ul class="mt-2 flex flex-col gap-1">
        <li
          v-for="row in rows"
          :key="row.line"
          class="rounded-lg border px-3 py-2 text-sm"
          :class="row.errors.length ? 'border-petal/50 bg-petal/10' : 'border-ink/10 bg-white/70'"
        >
          <span class="font-semibold text-ink">{{ row.party || '—' }}</span>
          <span class="text-ink/80"> · {{ row.guest || '—' }}</span>
          <span v-if="row.phone" class="text-ink/60"> · {{ row.phone }}</span>
          <span v-if="row.isChild" class="text-leaf-deep"> · child</span>
          <p v-if="row.errors.length" class="mt-1 text-petal-deep" role="alert">{{ row.errors.join(' ') }}</p>
        </li>
      </ul>
      <p v-if="hasErrors" class="mt-3 text-sm text-petal-deep">
        Fix the highlighted rows in your CSV and preview again — nothing is imported while errors remain.
      </p>
      <button
        v-else
        type="button"
        data-testid="confirm-import"
        :disabled="pending"
        class="mt-3 rounded-full bg-leaf-deep px-5 py-2 text-cream hover:bg-leaf disabled:opacity-60"
        @click="confirmImport"
      >
        Confirm import
      </button>
    </div>

    <p v-if="notice" class="mt-4 text-sm text-leaf-deep" role="status">{{ notice }}</p>
    <p v-if="error" class="mt-4 text-sm text-petal" role="alert">{{ error }}</p>
  </section>
</template>
