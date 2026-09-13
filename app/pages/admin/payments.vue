<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Payments — Wedding HQ', robots: 'noindex' })

interface Credit {
  transactionId: string
  amount: number
  created: string
  reference: string
  payerName: string | null
}

interface PartySummary {
  id: number
  name: string
  roomTotal: number
  amountPaid: number
}

const route = useRoute()
const { data: status, refresh: refreshStatus } = await useFetch('/api/admin/monzo/status')
const { data: partyData, refresh: refreshParties } = await useFetch<{ parties: PartySummary[] }>('/api/admin/parties')

const balances = computed(() => (partyData.value?.parties ?? [])
  .filter(party => party.roomTotal > 0)
  .map(party => ({ ...party, shortfall: Math.round((party.roomTotal - party.amountPaid) * 100) / 100 })))

const formatDate = (iso: string) => new Date(iso).toLocaleString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const matched = ref<{ transactionId: string, partyName: string, amount: number, matchedOn: string }[]>([])
const unmatched = ref<Credit[]>([])
const assignTo = ref<Record<string, number | undefined>>({})
const running = ref(false)
const error = ref('')

const errorMessage = (caught: unknown, fallback: string) =>
  (caught as { data?: { message?: string } }).data?.message ?? fallback

async function runCheck() {
  running.value = true
  error.value = ''
  try {
    const result = await $fetch('/api/admin/monzo/check', { method: 'POST' })
    matched.value = result.matched
    unmatched.value = result.unmatched
    await refreshParties()
  }
  catch (caught) {
    error.value = errorMessage(caught, 'The Monzo check failed.')
  }
  finally {
    running.value = false
    await refreshStatus()
  }
}

// only forgets it on this page — nothing about an unmatched credit was ever stored
function dismiss(credit: Credit) {
  unmatched.value = unmatched.value.filter(entry => entry.transactionId !== credit.transactionId)
}

async function assign(credit: Credit) {
  const partyId = assignTo.value[credit.transactionId]
  if (!partyId) return
  error.value = ''
  try {
    await $fetch('/api/admin/monzo/assign', {
      method: 'POST',
      body: { partyId, transactionId: credit.transactionId, amount: credit.amount },
    })
    dismiss(credit)
    await refreshParties()
  }
  catch (caught) {
    error.value = errorMessage(caught, 'Could not assign that payment.')
  }
}
</script>

<template>
  <section>
    <h1 class="font-display text-3xl text-ink">Payments</h1>

    <p v-if="!status?.available" class="mt-3 rounded-lg bg-petal/20 px-3 py-2 text-sm text-petal-deep" data-unavailable>
      Monzo reconciliation isn't set up — add the Monzo client id and secret to enable it.
      Amounts paid can still be entered by hand on each party.
    </p>

    <template v-else>
      <p class="mt-2 text-sm text-ink/70" data-last-checked>
        Last successful check: {{ status.lastChecked ? formatDate(status.lastChecked) : 'never' }}
      </p>
      <p v-if="status.stale" class="mt-2 rounded-lg bg-petal/20 px-3 py-2 text-sm text-petal-deep" role="alert" data-stale-warning>
        Monzo only shares the last 90 days of transactions. Run a check soon, or payments older than that become unreachable.
      </p>
      <p v-if="route.query.monzo === 'refused'" class="mt-2 text-sm text-petal-deep" role="alert">
        Monzo authorisation was declined or didn't complete, so nothing was checked.
      </p>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <button
          v-if="status.authorised"
          type="button"
          class="rounded-full bg-leaf-deep px-4 py-1.5 text-sm text-cream hover:bg-leaf disabled:opacity-50"
          :disabled="running"
          data-run-check
          @click="runCheck"
        >
          {{ running ? 'Checking…' : 'Run the check' }}
        </button>
        <a v-else href="/api/admin/monzo/authorise" class="rounded-full bg-leaf-deep px-4 py-1.5 text-sm text-cream hover:bg-leaf">
          Connect Monzo
        </a>
        <p v-if="status.authorised" class="text-sm text-ink/70">If Monzo asks, approve access in the app first.</p>
      </div>
    </template>

    <p v-if="error" class="mt-3 rounded-lg bg-petal/20 px-3 py-2 text-sm text-petal-deep" role="alert">{{ error }}</p>

    <div v-if="matched.length" class="mt-6">
      <h2 class="font-display text-xl text-ink">Matched this check</h2>
      <ul class="mt-2 space-y-1 text-sm">
        <li v-for="entry in matched" :key="entry.transactionId" class="text-ink">
          £{{ entry.amount }} → {{ entry.partyName }} <span class="text-ink/60">(by {{ entry.matchedOn }})</span>
        </li>
      </ul>
    </div>

    <div v-if="unmatched.length" class="mt-6">
      <h2 class="font-display text-xl text-ink">Needs a look</h2>
      <p class="text-sm text-ink/70">Shown once and never saved. Assign a wedding payment to its party, or dismiss anything else.</p>
      <ul class="mt-2 flex flex-col gap-2">
        <li
          v-for="credit in unmatched"
          :key="credit.transactionId"
          class="flex flex-wrap items-center gap-2 rounded-xl border border-ink/10 bg-white/70 p-3 text-sm"
          data-unmatched
        >
          <span class="font-semibold text-ink">£{{ credit.amount }}</span>
          <span class="text-ink">{{ credit.payerName ?? 'Unknown payer' }}</span>
          <span class="text-ink/60">{{ credit.reference }} · {{ formatDate(credit.created) }}</span>
          <select
            v-model.number="assignTo[credit.transactionId]"
            :name="`assign-${credit.transactionId}`"
            class="ms-auto rounded-lg border border-leaf/40 bg-white/70 px-2 py-1 text-ink"
          >
            <option :value="undefined" disabled>Choose a party</option>
            <option v-for="party in partyData?.parties ?? []" :key="party.id" :value="party.id">{{ party.name }}</option>
          </select>
          <button type="button" class="text-leaf-deep hover:text-petal disabled:opacity-50" :disabled="!assignTo[credit.transactionId]" data-assign @click="assign(credit)">
            Assign
          </button>
          <button type="button" class="text-petal-deep hover:text-petal" data-dismiss @click="dismiss(credit)">
            Dismiss
          </button>
        </li>
      </ul>
    </div>

    <h2 class="mt-8 font-display text-xl text-ink">Room balances</h2>
    <ul class="mt-2 flex flex-col gap-2">
      <li v-for="party in balances" :key="party.id" class="flex flex-wrap justify-between gap-2 rounded-lg border border-ink/10 bg-white/70 px-3 py-2 text-sm">
        <NuxtLink :to="`/admin/parties/${party.id}`" class="font-semibold text-ink hover:text-petal">{{ party.name }}</NuxtLink>
        <span class="text-ink/70">
          Owes £{{ party.roomTotal }} · paid £{{ party.amountPaid }} ·
          <span :class="party.shortfall > 0 ? 'font-semibold text-petal-deep' : 'text-leaf-deep'">
            {{ party.shortfall > 0 ? `£${party.shortfall} short` : 'settled' }}
          </span>
        </span>
      </li>
    </ul>
    <p v-if="!balances.length" class="mt-2 text-sm text-ink/60">No rooms booked yet.</p>
  </section>
</template>
