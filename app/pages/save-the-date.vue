<script setup lang="ts">
import { schedule, venue } from "#shared/content";
import { validateSaveTheDate } from "#shared/utils/save-the-date";

// public save-the-date: no session, no site chrome — layout: false skips the
// nav header entirely; minimal footer is inlined below
definePageMeta({ layout: false });

const weddingDate = new Date(schedule[0]!.start);
const longDate = weddingDate.toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const footerDate = [
  String(weddingDate.getDate()).padStart(2, "0"),
  String(weddingDate.getMonth() + 1).padStart(2, "0"),
  weddingDate.getFullYear(),
].join(" · ");

/** the night before and the night of, as guests read them: "Friday 15 January" */
const nightLabel = (offsetDays: number) => {
  const date = new Date(weddingDate);
  date.setDate(date.getDate() + offsetDays);
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const photos = ["/photos/save-the-date-1.jpg", "/photos/save-the-date-2.jpg"];
const photoIndex = ref(0);
const cyclePhoto = () => {
  photoIndex.value = (photoIndex.value + 1) % photos.length;
};

const form = reactive({
  name: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postcode: "",
  country: "United Kingdom",
  stayNightBefore: false,
  stayNightOf: false,
});

const submitted = ref(false);
const pending = ref(false);
const error = ref("");

async function submit() {
  error.value = "";
  // same validator the server runs; this is only to save a round trip
  const checked = validateSaveTheDate(form);
  if (!checked.ok) {
    error.value = checked.error;
    return;
  }
  pending.value = true;
  try {
    await $fetch("/api/save-the-date", { method: "POST", body: { ...form } });
    submitted.value = true;
  } catch (err) {
    error.value =
      (err as { data?: { message?: string } }).data?.message ??
      "Something went wrong — please try again.";
  } finally {
    pending.value = false;
  }
}

const fieldClass =
  "w-full rounded-2xl border border-leaf/40 bg-white/70 px-4 py-3 text-ink placeholder:text-leaf/60 transition-colors hover:border-petal focus:border-petal focus:outline-none";

useSeoMeta({
  title: "Save the Date — Ciera & Martin",
  description: () =>
    `Ciera and Martin are getting married on ${longDate} at ${venue.name}, ${venue.county}. Save the date!`,
  ogTitle: "Save the Date — Ciera & Martin",
  ogDescription: () =>
    `${longDate} — ${venue.name}, ${venue.county}. Invitation to follow.`,
  ogImage: "/og.png",
});
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-x-clip">
    <FallingPetals />
    <FloralHeader floral-classes="md:w-[50vw]" />
    <main class="mt-16 relative z-10 mx-auto w-full max-w-3xl grow px-6 pb-8">
      <section v-reveal.focal class="pt-8 text-center sm:pt-24">
        <p
          class="text-xs font-medium uppercase tracking-[0.4em] text-petal-deep"
        >
          Save the date
        </p>
        <h1
          class="mt-4 font-display text-5xl font-light italic text-ink sm:text-6xl"
        >
          Ciera <span class="text-petal">&amp;</span> Martin
        </h1>

        <!-- circle garland overflows ~70-90px above the photo; margin covers it plus breathing room -->
        <FloralArch
          variant="circle"
          class="mt-12 w-64 sm:mt-16 sm:w-80 md:mt-20 md:w-102 lg:w-120"
        >
          <button
            type="button"
            class="block w-full cursor-pointer"
            aria-label="Show next photo"
            @click="cyclePhoto"
          >
            <NuxtImg
              :src="photos[photoIndex]"
              alt="Ciera and Martin"
              width="960"
              height="960"
              sizes="256px sm:320px md:408px lg:480px"
              class="aspect-square h-auto w-full object-cover"
            />
          </button>
        </FloralArch>

        <p class="mt-12 font-display text-3xl text-ink sm:text-4xl">
          {{ longDate }}
        </p>
        <p class="mt-3 text-sm uppercase tracking-widest text-leaf-deep">
          <a
            :href="venue.url"
            target="_blank"
            rel="noopener"
            class="transition-colors hover:text-petal"
            >{{ venue.name }}</a
          >
          — {{ venue.county }}, England
        </p>
        <p class="mt-8 italic text-leaf-deep">Invitation to follow</p>
      </section>

      <!-- confirmation replaces the form, so nobody double-submits by reflex -->
      <section
        v-if="submitted"
        v-reveal
        class="mx-auto mt-16 max-w-md text-center"
      >
        <FloralDivider class="mx-auto w-40" />
        <h2 class="mt-6 font-display text-3xl text-ink">Thank you!</h2>
        <p class="mt-4 text-leaf-deep">
          We have your details and your invitation will be in the post. If you
          told us you'd like a room, we'll be in touch once the block booking is
          confirmed.
        </p>
        <button
          type="button"
          class="mt-8 rounded-full border border-leaf/40 px-5 py-2.5 font-display text-sm text-leaf-deep transition hover:border-petal hover:text-petal"
          @click="submitted = false"
        >
          Send another reply
        </button>
      </section>

      <!-- the heading leads; each field follows a beat behind it -->
      <section v-else class="mx-auto mt-16 max-w-md">
        <div v-reveal>
          <FloralDivider class="mx-auto w-40" />
          <h2 class="mt-6 text-center font-display text-3xl text-ink">
            Save your place
          </h2>
          <p class="mt-3 text-center text-leaf-deep">
            Leave us your address so we can post your invitation, and let us
            know if you'd like a room at the venue.
          </p>
        </div>

        <form class="mt-8 text-left" @submit.prevent="submit">
          <label v-reveal class="block text-sm text-leaf-deep">
            Your name<span class="text-petal-deep">*</span>
            <input
              v-model="form.name"
              type="text"
              name="name"
              autocomplete="name"
              required
              placeholder="e.g. Ciera &amp; Martin Forry-Pezet"
              class="mt-1"
              :class="fieldClass"
            />
          </label>

          <label v-reveal class="mt-4 block text-sm text-leaf-deep">
            Phone number<span class="text-petal-deep">*</span>
            <input
              v-model="form.phone"
              type="tel"
              name="phone"
              autocomplete="tel"
              inputmode="tel"
              required
              placeholder="e.g. 07700 000000"
              class="mt-1"
              :class="fieldClass"
            />
          </label>

          <label v-reveal class="mt-4 block text-sm text-leaf-deep">
            Address<span class="text-petal-deep">*</span>
            <input
              v-model="form.addressLine1"
              type="text"
              name="addressLine1"
              autocomplete="address-line1"
              required
              placeholder="House and street"
              class="mt-1"
              :class="fieldClass"
            />
          </label>

          <label v-reveal class="mt-2 block text-sm text-leaf-deep">
            <span class="sr-only">Address line 2</span>
            <input
              v-model="form.addressLine2"
              type="text"
              name="addressLine2"
              autocomplete="address-line2"
              placeholder="Village or area (optional)"
              :class="fieldClass"
            />
          </label>

          <div v-reveal class="mt-4 flex flex-col gap-4 sm:flex-row">
            <label class="block flex-1 text-sm text-leaf-deep">
              Town or city<span class="text-petal-deep">*</span>
              <input
                v-model="form.city"
                type="text"
                name="city"
                autocomplete="address-level2"
                required
                class="mt-1"
                placeholder="e.g. Taunton"
                :class="fieldClass"
              />
            </label>
            <label class="block text-sm text-leaf-deep sm:w-40">
              Postcode<span class="text-petal-deep">*</span>
              <input
                v-model="form.postcode"
                type="text"
                name="postcode"
                autocomplete="postal-code"
                required
                class="mt-1"
                placeholder="e.g. TA4 4DS"
                :class="fieldClass"
              />
            </label>
          </div>

          <label v-reveal class="mt-4 block text-sm text-leaf-deep">
            Country<span class="text-petal-deep">*</span>
            <input
              v-model="form.country"
              type="text"
              name="country"
              autocomplete="country-name"
              required
              class="mt-1"
              :class="fieldClass"
            />
          </label>

          <fieldset
            v-reveal
            class="mt-8 rounded-2xl border border-leaf/30 bg-white/60 px-5 py-4"
          >
            <legend class="px-2 font-display text-lg text-ink">
              Staying over
            </legend>
            <p class="text-sm text-leaf-deep">
              We would love you to stay at {{ venue.name }} with us. We're block
              booking rooms at maximum
              <strong>£200 per room per night</strong> (twin rooms available,
              any logistic questions please let us know), with dinner and
              breakfast included. Ticking a box registers your interest — it
              isn't a booking, and nothing is charged. We just need to gauge
              numbers so we reserve enough rooms.
            </p>
            <label
              class="mt-4 flex cursor-pointer items-start gap-3 text-sm text-leaf-deep"
            >
              <input
                v-model="form.stayNightBefore"
                type="checkbox"
                name="stayNightBefore"
                class="mt-0.5 size-5 shrink-0 rounded border-leaf/40 accent-petal"
              />
              <span
                >The night before — {{ nightLabel(-1) }}
                <span class="block text-leaf-deep/70"
                  >Arrive early and settle in.</span
                ></span
              >
            </label>
            <label
              class="mt-3 flex cursor-pointer items-start gap-3 text-sm text-leaf-deep"
            >
              <input
                v-model="form.stayNightOf"
                type="checkbox"
                name="stayNightOf"
                class="mt-0.5 size-5 shrink-0 rounded border-leaf/40 accent-petal"
              />
              <span
                >The night of the wedding — {{ nightLabel(0) }}
                <span class="block text-leaf-deep/70"
                  >No taxis, no rush home.</span
                ></span
              >
            </label>
          </fieldset>

          <p v-if="error" class="mt-4 text-center text-sm text-petal-deep">
            {{ error }}
          </p>

          <button
            v-reveal
            type="submit"
            :disabled="pending"
            class="mt-6 w-full rounded-full bg-petal px-6 py-3 font-display text-lg text-white transition hover:bg-petal-deep disabled:opacity-60"
          >
            {{ pending ? "Sending…" : "Send our details" }}
          </button>
        </form>
      </section>
    </main>
    <footer class="relative z-10 py-10 text-center">
      <FloralDivider class="mx-auto w-40" />
      <p class="mt-3 font-display text-2xl font-light italic text-ink">
        C <span class="text-petal">&amp;</span> M
      </p>
      <p class="mt-3 text-[11px] uppercase tracking-[0.34em] text-ink/60">
        {{ footerDate }} — {{ venue.county }}, England
      </p>
    </footer>
  </div>
</template>
