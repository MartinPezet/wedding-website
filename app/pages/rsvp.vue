<script setup lang="ts">
import { menu } from '~~/shared/content'

interface GuestForm {
  id: number
  name: string
  isChild: boolean
  attending: '' | 'yes' | 'no'
  mealChoiceId: string
  dietaryNotes: string
}

const { data } = await useFetch('/api/rsvp')

const guests = ref<GuestForm[]>([])
const phone = ref('')
const song = ref('')
const note = ref('')
const submitted = ref(false)
const error = ref('')
const pending = ref(false)

if (data.value?.party) {
  guests.value = data.value.guests.map(guest => ({
    id: guest.id,
    name: guest.name,
    isChild: guest.isChild,
    attending: guest.attending === null ? '' : guest.attending ? 'yes' : 'no',
    mealChoiceId: guest.mealChoiceId ?? '',
    dietaryNotes: guest.dietaryNotes ?? '',
  }))
  phone.value = data.value.phone ?? ''
  song.value = data.value.party.songRequest ?? ''
  note.value = data.value.party.noteToCouple ?? ''
}

const allMealOptions = [...menu.options, ...menu.childMenu ?? []]
const mealsFor = (guest: GuestForm) =>
  guest.isChild && menu.childMenu?.length ? menu.childMenu : menu.options
const mealName = (id: string | null) =>
  allMealOptions.find(option => option.id === id)?.name ?? '—'

const anyAttending = computed(() => guests.value.some(guest => guest.attending === 'yes'))

const deadlineLabel = computed(() => {
  const deadline = data.value?.deadline
  if (!deadline) return ''
  return new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
})

async function submit() {
  error.value = ''
  if (guests.value.some(guest => !guest.attending)) {
    error.value = 'Please answer for every guest.'
    return
  }
  if (guests.value.some(guest => guest.attending === 'yes' && !guest.mealChoiceId)) {
    error.value = 'Please choose a meal for everyone attending.'
    return
  }
  const normalised = normalisePhone(phone.value)
  if (!normalised) {
    error.value = 'Please enter a valid phone number.'
    return
  }
  pending.value = true
  try {
    await $fetch('/api/rsvp', {
      method: 'POST',
      body: {
        phone: normalised,
        songRequest: song.value || undefined,
        noteToCouple: note.value || undefined,
        guests: guests.value.map(guest => ({
          id: guest.id,
          attending: guest.attending === 'yes',
          mealChoiceId: guest.attending === 'yes' ? guest.mealChoiceId : undefined,
          dietaryNotes: guest.dietaryNotes || undefined,
        })),
      },
    })
    phone.value = normalised
    submitted.value = true
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
  title: 'RSVP — Ciera & Martin',
  description: 'Let Ciera and Martin know if you can make it.',
})

const fieldClass = 'rounded-2xl border border-leaf/40 bg-white/70 px-4 py-3 text-ink placeholder:text-leaf/60 focus:border-petal focus:outline-none'
</script>

<template>
  <section class="pt-12 text-center sm:pt-20">
    <FloralHeading eyebrow="Répondez s'il vous plaît">RSVP</FloralHeading>

    <!-- no party context: point back to the invite -->
    <div v-if="!data?.party" class="mx-auto mt-8 max-w-md">
      <p class="text-leaf-deep">
        To reply, please open the QR code or link printed on your invitation —
        it brings you straight to your party's RSVP.
      </p>
      <p class="mt-4 text-leaf-deep">
        Lost your invite? Just contact us and we'll sort you out.
      </p>
    </div>

    <!-- deadline passed: read-only summary -->
    <div v-else-if="data.locked" class="mx-auto mt-8 max-w-md">
      <p class="text-leaf-deep">The RSVP deadline has passed, so answers are locked in.</p>
      <ul class="mt-6 space-y-3 text-left">
        <li
          v-for="guest in guests"
          :key="guest.id"
          class="rounded-2xl border border-leaf/30 bg-white/60 px-5 py-4"
        >
          <p class="font-display text-lg text-ink">{{ guest.name }}</p>
          <p class="mt-1 text-sm text-leaf-deep">
            {{ guest.attending === 'yes' ? `Attending — ${mealName(guest.mealChoiceId)}`
              : guest.attending === 'no' ? 'Not attending' : 'No reply received' }}
          </p>
        </li>
      </ul>
      <p class="mt-6 text-leaf-deep">Need to change something? Please contact us directly.</p>
    </div>

    <!-- confirmation -->
    <div v-else-if="submitted" class="mx-auto mt-8 max-w-md">
      <FloralDivider class="mx-auto w-40" />
      <template v-if="anyAttending">
        <h2 class="mt-6 font-display text-3xl text-ink">We can't wait to see you!</h2>
        <p class="mt-4 text-leaf-deep">
          Your RSVP is in. You can come back and change your answers any time
          <template v-if="deadlineLabel">until {{ deadlineLabel }}</template>.
        </p>
      </template>
      <template v-else>
        <h2 class="mt-6 font-display text-3xl text-ink">We'll miss you</h2>
        <p class="mt-4 text-leaf-deep">
          Thank you for letting us know — you'll be with us in spirit.
          If plans change, you can update your reply
          <template v-if="deadlineLabel">until {{ deadlineLabel }}</template>.
        </p>
      </template>
      <button
        type="button"
        class="mt-8 rounded-full border border-leaf/40 px-5 py-2.5 font-display text-sm text-leaf-deep transition hover:border-petal hover:text-petal"
        @click="submitted = false"
      >
        Change your answers
      </button>
    </div>

    <!-- the form -->
    <form v-else class="mx-auto mt-8 max-w-md text-left" @submit.prevent="submit">
      <p class="text-center text-leaf-deep">
        Hello, <span class="font-display text-ink">{{ data.party.name }}</span>!
        <template v-if="deadlineLabel"> Please reply by {{ deadlineLabel }}.</template>
      </p>

      <fieldset
        v-for="guest in guests"
        :key="guest.id"
        class="mt-6 rounded-2xl border border-leaf/30 bg-white/60 px-5 py-4"
      >
        <legend class="px-2 font-display text-lg text-ink">{{ guest.name }}</legend>
        <div class="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label class="flex items-center gap-2 text-leaf-deep">
            <input
              v-model="guest.attending"
              type="radio"
              :name="`attending-${guest.id}`"
              value="yes"
              class="accent-petal"
            >
            Joyfully accepts
          </label>
          <label class="flex items-center gap-2 text-leaf-deep">
            <input
              v-model="guest.attending"
              type="radio"
              :name="`attending-${guest.id}`"
              value="no"
              class="accent-petal"
            >
            Regretfully declines
          </label>
        </div>
        <template v-if="guest.attending === 'yes'">
          <select
            v-model="guest.mealChoiceId"
            :name="`meal-${guest.id}`"
            required
            class="mt-3 w-full"
            :class="fieldClass"
          >
            <option value="" disabled>Choose a meal</option>
            <option v-for="option in mealsFor(guest)" :key="option.id" :value="option.id">
              {{ option.name }}
            </option>
          </select>
          <textarea
            v-model="guest.dietaryNotes"
            :name="`dietary-${guest.id}`"
            rows="2"
            placeholder="Dietary requirements or allergies"
            class="mt-3 w-full"
            :class="fieldClass"
          />
        </template>
      </fieldset>

      <div class="mt-8 flex flex-col gap-3">
        <label class="text-sm uppercase tracking-widest text-petal-deep" for="rsvp-phone">
          Best contact number
        </label>
        <input
          id="rsvp-phone"
          v-model="phone"
          type="tel"
          name="phone"
          required
          autocomplete="tel"
          placeholder="Phone number"
          :class="fieldClass"
        >
        <label class="mt-3 text-sm uppercase tracking-widest text-petal-deep" for="rsvp-song">
          Song that gets you dancing <span class="normal-case tracking-normal text-leaf/80">(optional)</span>
        </label>
        <input
          id="rsvp-song"
          v-model="song"
          type="text"
          name="song"
          placeholder="Song request"
          :class="fieldClass"
        >
        <label class="mt-3 text-sm uppercase tracking-widest text-petal-deep" for="rsvp-note">
          A note for us <span class="normal-case tracking-normal text-leaf/80">(optional)</span>
        </label>
        <textarea
          id="rsvp-note"
          v-model="note"
          name="note"
          rows="3"
          placeholder="Anything you'd like us to know"
          :class="fieldClass"
        />
      </div>

      <p v-if="error" class="mt-4 text-center text-sm text-petal" role="alert">{{ error }}</p>

      <button
        type="submit"
        :disabled="pending"
        class="mt-6 w-full rounded-full bg-leaf-deep px-5 py-3 font-display text-cream transition hover:bg-leaf disabled:opacity-60"
      >
        {{ pending ? 'Sending…' : 'Send our reply' }}
      </button>
    </form>
  </section>
</template>
