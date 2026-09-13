<script setup lang="ts">
import { rooms as roomContent } from "#shared/content";
import type { RoomChoice, RoomNight } from "#shared/content";

interface GuestForm {
  id: number;
  name: string;
  isChild: boolean;
  attending: "" | "yes" | "no";
}

interface RoomForm {
  choice: RoomChoice | "";
  shareWith: string;
}

const { data } = await useFetch("/api/rsvp");

const guests = ref<GuestForm[]>([]);
const bookedRooms = ref<Record<RoomNight, RoomForm[]>>({ before: [], of: [] });
const song = ref("");
const note = ref("");
const submitted = ref(false);
const error = ref("");
const pending = ref(false);

if (data.value?.party) {
  guests.value = data.value.guests.map((guest) => ({
    id: guest.id,
    name: guest.name,
    isChild: guest.isChild,
    attending: guest.attending === null ? "" : guest.attending ? "yes" : "no",
  }));
  for (const room of data.value.rooms) {
    bookedRooms.value[room.night].push({
      choice: room.choice,
      shareWith: room.shareWith ?? "",
    });
  }
  song.value = data.value.party.songRequest ?? "";
  note.value = data.value.party.noteToCouple ?? "";
}

const attendingCount = computed(
  () => guests.value.filter((guest) => guest.attending === "yes").length,
);
const anyAttending = computed(() => attendingCount.value > 0);

/** wording and the per-night cap both follow how many of the party are coming */
const choiceLabel = (choice: RoomChoice) =>
  roomChoiceLabel(choice, attendingCount.value);
const roomCap = computed(() => maxRoomsPerNight(attendingCount.value));
const canAddRoom = (night: RoomNight) =>
  bookedRooms.value[night].length < roomCap.value;

/**
 * Flat, priceable view of the form's rooms — submitted in night order.
 * Nobody is asked how many sleep in each room: the party's attending guests are
 * spread across that night's rooms in order, a share taking one of them and a
 * room of their own taking up to two, so the night-before per-person price only
 * ever counts beds the party actually needs.
 */
const chosenRooms = computed(() =>
  ROOM_NIGHTS.flatMap((night) => {
    let unplaced = attendingCount.value;
    return bookedRooms.value[night]
      .filter((room) => room.choice !== "")
      .map((room) => {
        const occupants =
          room.choice === "our_room" ? Math.min(Math.max(unplaced, 1), 2) : 1;
        unplaced -= occupants;
        return {
          night,
          choice: room.choice as RoomChoice,
          shareWith: room.choice === "share_named" ? room.shareWith : null,
          occupants,
        };
      });
  }),
);

const total = computed(() => roomTotal(chosenRooms.value));

/** what one row of the form currently costs, using its derived occupancy */
const priceOf = (night: RoomNight, index: number) => {
  const room = chosenRooms.value.filter((entry) => entry.night === night)[
    index
  ];
  return room ? roomPrice(night, room.choice, room.occupants) : 0;
};

const addRoom = (night: RoomNight) =>
  bookedRooms.value[night].push({ choice: "", shareWith: "" });
const removeRoom = (night: RoomNight, index: number) =>
  bookedRooms.value[night].splice(index, 1);

const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

const deadlineLabel = computed(() => formatDate(data.value?.deadline));
const paymentDeadlineLabel = computed(() =>
  formatDate(data.value?.paymentDeadline),
);

/** locked-summary line for one stored room, e.g. "Sharing with Jo Jones — £80" */
const roomSummary = (room: {
  night: RoomNight;
  choice: RoomChoice;
  shareWith: string | null;
  occupants: number;
}) => {
  const label =
    room.choice === "share_named" && room.shareWith
      ? `Sharing with ${room.shareWith}`
      : roomChoiceLabel(room.choice, attendingCount.value);
  return `${label} — £${roomPrice(room.night, room.choice, room.occupants)}`;
};

async function submit() {
  error.value = "";
  if (guests.value.some((guest) => !guest.attending)) {
    error.value = "Please answer for every guest.";
    return;
  }
  if (
    ROOM_NIGHTS.some((night) =>
      bookedRooms.value[night].some(
        (room) => room.choice === "share_named" && !room.shareWith.trim(),
      ),
    )
  ) {
    error.value = "Please say who you're sharing each shared room with.";
    return;
  }
  pending.value = true;
  try {
    await $fetch("/api/rsvp", {
      method: "POST",
      body: {
        // contact numbers are held by the couple, not re-asked here
        phone: "",
        songRequest: song.value || undefined,
        noteToCouple: note.value || undefined,
        guests: guests.value.map((guest) => ({
          id: guest.id,
          attending: guest.attending === "yes",
        })),
        rooms: chosenRooms.value,
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
  title: "RSVP — Ciera & Martin",
  description: "Let Ciera and Martin know if you can make it.",
});

const fieldClass =
  "rounded-2xl border border-leaf/40 bg-white/70 px-4 py-3 text-ink placeholder:text-leaf/60 transition-colors hover:border-petal focus:border-petal focus:outline-none";
</script>

<template>
  <section class="pt-12 text-center sm:pt-20">
    <FloralHeading v-reveal.focal eyebrow="Répondez s'il vous plaît"
      >RSVP</FloralHeading
    >

    <!-- no party context: point back to the invite -->
    <div v-if="!data?.party" v-reveal class="mx-auto mt-8 max-w-md">
      <p class="text-leaf-deep">
        To reply, please open the QR code or link printed on your invitation —
        it brings you straight to your party's RSVP.
      </p>
      <p class="mt-4 text-leaf-deep">
        Lost your invite? Just contact us and we'll sort you out.
      </p>
    </div>

    <!-- deadline passed: read-only summary -->
    <div v-else-if="data.locked" v-reveal class="mx-auto mt-8 max-w-md">
      <p class="text-leaf-deep">
        The RSVP deadline has passed, so answers are locked in.
      </p>
      <ul class="mt-6 space-y-3 text-left">
        <li
          v-for="guest in guests"
          :key="guest.id"
          class="rounded-2xl border border-leaf/30 bg-white/60 px-5 py-4"
        >
          <p class="font-display text-lg text-ink">{{ guest.name }}</p>
          <p class="mt-1 text-sm text-leaf-deep">
            {{
              guest.attending === "yes"
                ? "Attending"
                : guest.attending === "no"
                  ? "Not attending"
                  : "No reply received"
            }}
          </p>
        </li>
      </ul>
      <template v-for="night in ROOM_NIGHTS" :key="night">
        <div
          v-if="data.rooms.some((room) => room.night === night)"
          class="mt-6"
        >
          <h3 class="text-left font-display text-lg text-ink">
            {{ ROOM_NIGHT_LABELS[night] }}
          </h3>
          <ul class="mt-2 space-y-2 text-left">
            <li
              v-for="(room, index) in data.rooms.filter(
                (entry) => entry.night === night,
              )"
              :key="index"
              class="rounded-2xl border border-leaf/30 bg-white/60 px-5 py-3 text-sm text-leaf-deep"
            >
              {{ roomSummary(room) }}
            </li>
          </ul>
        </div>
      </template>
      <p class="mt-6 text-leaf-deep">
        Need to change something? Please contact us directly.
      </p>
    </div>

    <!-- confirmation -->
    <div v-else-if="submitted" v-reveal class="mx-auto mt-8 max-w-md">
      <FloralDivider class="mx-auto w-40" />
      <template v-if="anyAttending">
        <h2 class="mt-6 font-display text-3xl text-ink">
          We can't wait to see you!
        </h2>
        <p class="mt-4 text-leaf-deep">
          Your RSVP is in. You can come back and change your answers any time
          <template v-if="deadlineLabel">until {{ deadlineLabel }}</template
          >.
        </p>
      </template>
      <template v-else>
        <h2 class="mt-6 font-display text-3xl text-ink">We'll miss you</h2>
        <p class="mt-4 text-leaf-deep">
          Thank you for letting us know — you'll be with us in spirit. If plans
          change, you can update your reply
          <template v-if="deadlineLabel">until {{ deadlineLabel }}</template
          >.
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
    <form
      v-else
      class="mx-auto mt-8 max-w-md text-left"
      @submit.prevent="submit"
    >
      <p v-reveal class="text-center text-leaf-deep">
        Hello, <span class="font-display text-ink">{{ data.party.name }}</span
        >!
        <template v-if="deadlineLabel">
          Please reply by {{ deadlineLabel }}.</template
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
        <div class="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <!-- native input stays for keyboard/AT; checked state shows a floret -->
          <label
            v-for="option in [
              { value: 'yes', label: 'Joyfully accepts' },
              { value: 'no', label: 'Regretfully declines' },
            ]"
            :key="option.value"
            class="flex cursor-pointer items-center gap-2 text-leaf-deep"
          >
            <span class="relative grid size-5 shrink-0 place-items-center">
              <input
                v-model="guest.attending"
                type="radio"
                :name="`attending-${guest.id}`"
                :value="option.value"
                class="peer sr-only"
              />
              <span
                aria-hidden="true"
                class="absolute inset-0 rounded-full border border-leaf/40 bg-white/70 transition-colors peer-checked:border-petal peer-focus-visible:ring-2 peer-focus-visible:ring-petal/60"
              />
              <svg
                viewBox="-17 -17 34 34"
                aria-hidden="true"
                class="relative size-4 opacity-0 transition-opacity peer-checked:opacity-100"
              >
                <path
                  v-for="angle in [0, 90, 180, 270]"
                  :key="angle"
                  d="M0,1.5 C-5.5,-1.5 -6.5,-11 0,-15.5 C6.5,-11 5.5,-1.5 0,1.5 Z"
                  fill="var(--color-petal-mid)"
                  :transform="`rotate(${angle})`"
                />
                <circle r="2.6" fill="var(--color-gold-soft)" />
              </svg>
            </span>
            {{ option.label }}
          </label>
        </div>
      </fieldset>

      <!-- overnight rooms: the two nights are booked and priced separately -->
      <section v-if="anyAttending" v-reveal class="mt-10">
        <h2 class="font-display text-2xl text-ink">Staying over?</h2>
        <p class="mt-2 text-sm text-leaf-deep">
          Book as many rooms as you need for either night - most are doubles and
          twins.
        </p>

        <fieldset
          v-for="night in ROOM_NIGHTS"
          :key="night"
          class="mt-6 rounded-2xl border border-leaf/30 bg-white/60 px-5 py-4"
        >
          <legend class="px-2 font-display text-lg text-ink">
            {{ ROOM_NIGHT_LABELS[night] }}
          </legend>
          <p class="text-sm text-leaf-deep">
            <template v-if="night === 'before'">
              £{{ roomContent.prices.before.perPerson }} per person, including a
              hot food buffet dinner and continental breakfast.
            </template>
            <template v-else>
              £{{ roomContent.prices.of.ourRoom }} for a room of your own, or
              £{{ roomContent.prices.of.perPerson }}
              per person to share. This includes a full English breakfast the
              next day.
            </template>
          </p>

          <div
            v-for="(room, index) in bookedRooms[night]"
            :key="index"
            class="mt-4 border-t border-leaf/20 pt-4 first:border-t-0 first:pt-0"
          >
            <label class="block text-sm text-leaf-deep">
              Room {{ index + 1 }}
              <span class="relative mt-1 block">
                <select
                  v-model="room.choice"
                  :name="`room-${night}-${index}-choice`"
                  required
                  class="w-full appearance-none pr-10"
                  :class="fieldClass"
                >
                  <option value="" disabled>Choose an arrangement</option>
                  <option
                    v-for="choice in ROOM_CHOICES"
                    :key="choice"
                    :value="choice"
                  >
                    {{ choiceLabel(choice) }}
                  </option>
                </select>
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

            <label
              v-if="room.choice === 'share_named'"
              class="mt-3 block text-sm text-leaf-deep"
            >
              Who are you sharing with?
              <input
                v-model="room.shareWith"
                type="text"
                :name="`room-${night}-${index}-share`"
                required
                placeholder="Their name"
                class="mt-1 w-full"
                :class="fieldClass"
              />
            </label>

            <div class="mt-2 flex items-center justify-between text-sm">
              <span class="text-leaf-deep">
                <template v-if="room.choice"
                  >£{{ priceOf(night, index) }}</template
                >
              </span>
              <button
                type="button"
                class="text-petal underline transition hover:text-petal-deep"
                @click="removeRoom(night, index)"
              >
                Remove
              </button>
            </div>
          </div>

          <button
            v-if="canAddRoom(night)"
            :data-add-room="night"
            type="button"
            class="mt-4 rounded-full border border-leaf/40 px-4 py-2 font-display text-sm text-leaf-deep transition hover:border-petal hover:text-petal"
            @click="addRoom(night)"
          >
            Add a room
          </button>
        </fieldset>

        <div
          v-if="chosenRooms.length"
          class="mt-6 rounded-2xl border border-petal/40 bg-white/70 px-5 py-4"
        >
          <p data-payment-disclaimer class="text-sm text-leaf-deep">
            You don't have to pay right now - you can pay any time
            <template v-if="paymentDeadlineLabel"
              >before {{ paymentDeadlineLabel }}</template
            >.
          </p>
          <div class="mt-3 flex items-center justify-between gap-4">
            <p data-room-total class="font-display text-2xl text-ink">
              £{{ total }}
            </p>
            <a
              data-monzo-link
              :href="monzoLink(total, data.partyId!)"
              target="_blank"
              rel="noopener"
              class="rounded-full bg-leaf-deep px-5 py-2.5 font-display text-sm text-cream transition hover:bg-leaf"
            >
              Pay here
            </a>
          </div>
        </div>
      </section>

      <div v-reveal class="mt-8 flex flex-col gap-3">
        <label
          class="text-sm uppercase tracking-widest text-petal-deep"
          for="rsvp-song"
        >
          Song that gets you dancing
          <span class="normal-case tracking-normal text-leaf/80"
            >(optional)</span
          >
        </label>
        <input
          id="rsvp-song"
          v-model="song"
          type="text"
          name="song"
          placeholder="Song request"
          :class="fieldClass"
        />
        <label
          class="mt-3 text-sm uppercase tracking-widest text-petal-deep"
          for="rsvp-note"
        >
          A note for us
          <span class="normal-case tracking-normal text-leaf/80"
            >(optional)</span
          >
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

      <p v-if="error" class="mt-4 text-center text-sm text-petal" role="alert">
        {{ error }}
      </p>

      <button
        v-reveal
        type="submit"
        :disabled="pending"
        class="mt-6 w-full rounded-full bg-leaf-deep px-5 py-3 font-display text-cream transition hover:bg-leaf disabled:opacity-60"
      >
        {{ pending ? "Sending…" : "Send your reply" }}
      </button>
    </form>
  </section>
</template>
