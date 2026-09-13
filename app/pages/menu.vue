<script setup lang="ts">
import { menu } from "#shared/content";
import type { MenuCourse } from "#shared/content";

interface GuestForm {
  id: number;
  name: string;
  isChild: boolean;
  starterChoiceId: string;
  mainChoiceId: string;
  dessertChoiceId: string;
  dietaryNotes: string;
}

const { data } = await useFetch("/api/food");

const guests = ref<GuestForm[]>([]);
const submitted = ref(false);
const error = ref("");
const pending = ref(false);

// only guests already recorded as attending are ever offered a meal
if (data.value?.party) {
  guests.value = data.value.guests
    .filter((guest) => guest.attending === true)
    .map((guest) => ({
      id: guest.id,
      name: guest.name,
      isChild: guest.isChild,
      starterChoiceId: guest.starterChoiceId ?? "",
      mainChoiceId: guest.mainChoiceId ?? "",
      dessertChoiceId: guest.dessertChoiceId ?? "",
      dietaryNotes: guest.dietaryNotes ?? "",
    }));
}

const courseField = (course: MenuCourse) => COURSE_FIELDS[course.id];
const mealsFor = (course: MenuCourse, guest: GuestForm) =>
  optionsFor(course, guest.isChild);

const allMealOptions = menu.courses.flatMap((course) => [
  ...course.options,
  ...(course.childOptions ?? []),
]);
const optionName = (id: string) =>
  allMealOptions.find((option) => option.id === id)?.name;

/** locked-summary line: defined-course choice names, e.g. "Soup · Roast Beef" */
const choiceSummary = (guest: GuestForm) =>
  menu.courses
    .map((course) => optionName(guest[courseField(course)]))
    .filter(Boolean)
    .join(" · ") || "No choices made";

const deadlineLabel = computed(() => {
  const deadline = data.value?.deadline;
  if (!deadline) return "";
  return new Date(deadline).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

async function submit() {
  error.value = "";
  if (
    guests.value.some((guest) =>
      menu.courses.some((course) => !guest[courseField(course)]),
    )
  ) {
    error.value = "Please choose every course for everyone.";
    return;
  }
  pending.value = true;
  try {
    await $fetch("/api/food", {
      method: "POST",
      body: {
        guests: guests.value.map((guest) => ({
          id: guest.id,
          ...Object.fromEntries(
            menu.courses.map((course) => [
              courseField(course),
              guest[courseField(course)],
            ]),
          ),
          dietaryNotes: guest.dietaryNotes || undefined,
        })),
      },
    });
    submitted.value = true;
  } catch (err) {
    error.value =
      (err as { data?: { message?: string } }).data?.message ??
      "Something went wrong — please try again.";
  } finally {
    pending.value = false;
  }
}

useSeoMeta({
  title: "Menu — Ciera & Martin",
  description: "Choose your wedding breakfast.",
});

const fieldClass =
  "rounded-2xl border border-leaf/40 bg-white/70 px-4 py-3 text-ink placeholder:text-leaf/60 transition-colors hover:border-petal focus:border-petal focus:outline-none";
</script>

<template>
  <section class="pt-12 text-center sm:pt-20">
    <FloralHeading v-reveal.focal eyebrow="Wedding breakfast"
      >The Menu</FloralHeading
    >

    <!-- no party context: point back to the invite -->
    <div v-if="!data?.party" v-reveal class="mx-auto mt-8 max-w-md">
      <p class="text-leaf-deep">
        To choose your meal, please open the QR code or link printed on your
        invitation — it brings you straight to your party.
      </p>
      <p class="mt-4 text-leaf-deep">
        Lost your invite? Just contact us and we'll sort you out.
      </p>
    </div>

    <!-- toggle off: the menu isn't confirmed yet -->
    <div v-else-if="!data.open" v-reveal class="mx-auto mt-8 max-w-md">
      <FloralDivider class="mx-auto w-40" />
      <p class="mt-6 text-leaf-deep">
        Our menu isn't ready quite yet — we're still tasting our way through it.
      </p>
      <p class="mt-4 text-leaf-deep">
        We'll let you know the moment it's ready to choose from, and this page
        is where you'll come to pick.
      </p>
    </div>

    <!-- nobody attending recorded: the RSVP comes first -->
    <div v-else-if="!guests.length" v-reveal class="mx-auto mt-8 max-w-md">
      <p class="text-leaf-deep">
        Before choosing a meal, please let us know who's coming on your RSVP.
      </p>
      <NuxtLink
        to="/rsvp"
        class="mt-6 inline-block rounded-full bg-leaf-deep px-5 py-3 font-display text-cream transition hover:bg-leaf"
      >
        Complete your RSVP
      </NuxtLink>
    </div>

    <!-- deadline passed: read-only summary -->
    <div v-else-if="data.locked" v-reveal class="mx-auto mt-8 max-w-md">
      <p class="text-leaf-deep">
        The menu deadline has passed, so choices are locked in.
      </p>
      <ul class="mt-6 space-y-3 text-left">
        <li
          v-for="guest in guests"
          :key="guest.id"
          class="rounded-2xl border border-leaf/30 bg-white/60 px-5 py-4"
        >
          <p class="font-display text-lg text-ink">{{ guest.name }}</p>
          <p class="mt-1 text-sm text-leaf-deep">{{ choiceSummary(guest) }}</p>
          <p v-if="guest.dietaryNotes" class="mt-1 text-sm text-leaf-deep">
            {{ guest.dietaryNotes }}
          </p>
        </li>
      </ul>
      <p class="mt-6 text-leaf-deep">
        Need to change something? Please contact us directly.
      </p>
    </div>

    <!-- confirmation -->
    <div v-else-if="submitted" v-reveal class="mx-auto mt-8 max-w-md">
      <FloralDivider class="mx-auto w-40" />
      <h2 class="mt-6 font-display text-3xl text-ink">Delicious choices</h2>
      <p class="mt-4 text-leaf-deep">
        Your menu choices are in. You can come back and change them any time
        <template v-if="deadlineLabel">until {{ deadlineLabel }}</template
        >.
      </p>
      <button
        type="button"
        class="mt-8 rounded-full border border-leaf/40 px-5 py-2.5 font-display text-sm text-leaf-deep transition hover:border-petal hover:text-petal"
        @click="submitted = false"
      >
        Change your choices
      </button>
    </div>

    <!-- the form -->
    <form
      v-else
      class="mx-auto mt-8 max-w-md text-left"
      @submit.prevent="submit"
    >
      <p v-reveal class="text-center text-leaf-deep">
        Hello, <span class="font-display text-ink">{{ data.party.name }}</span
        >!
        <template v-if="deadlineLabel">
          Please choose by {{ deadlineLabel }}.</template
        >
      </p>

      <fieldset
        v-for="guest in guests"
        :key="guest.id"
        v-reveal
        class="mt-6 rounded-2xl border border-leaf/30 bg-white/60 px-5 py-4"
      >
        <legend class="px-2 font-display text-lg text-ink">
          {{ guest.name }}
        </legend>
        <label
          v-for="course in menu.courses"
          :key="course.id"
          class="mt-3 block text-sm text-leaf-deep"
        >
          {{ course.name }}
          <span class="relative mt-1 block">
            <select
              v-model="guest[courseField(course)]"
              :name="`meal-${course.id}-${guest.id}`"
              required
              class="w-full appearance-none pr-10"
              :class="fieldClass"
            >
              <option value="" disabled>
                Choose a {{ course.name.toLowerCase() }}
              </option>
              <option
                v-for="option in mealsFor(course, guest)"
                :key="option.id"
                :value="option.id"
              >
                {{ option.name }}
              </option>
            </select>
            <!-- custom chevron, padded off the edge (appearance-none removes the stock one) -->
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              class="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-leaf-deep"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </label>
        <textarea
          v-model="guest.dietaryNotes"
          :name="`dietary-${guest.id}`"
          rows="2"
          placeholder="Dietary requirements or allergies"
          class="mt-3 w-full"
          :class="fieldClass"
        />
      </fieldset>

      <p v-if="error" class="mt-4 text-center text-sm text-petal" role="alert">
        {{ error }}
      </p>

      <button
        type="submit"
        :disabled="pending"
        class="mt-6 w-full rounded-full bg-leaf-deep px-5 py-3 font-display text-cream transition hover:bg-leaf disabled:opacity-60"
      >
        {{ pending ? "Sending…" : "Send your choices" }}
      </button>
    </form>
  </section>
</template>
