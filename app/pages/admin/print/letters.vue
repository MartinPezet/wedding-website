<script setup lang="ts">
import { qrSvg } from "#shared/utils/qr";

definePageMeta({ layout: "print" });
useSeoMeta({ title: "RSVP letters — Wedding HQ", robots: "noindex" });

interface Party {
  id: number;
  name: string;
  token: string;
}
const { data } = await useFetch<{ parties: Party[] }>("/api/admin/parties");
const { data: settings } = await useFetch<{ rsvpDeadline?: string }>(
  "/api/admin/settings",
);
const route = useRoute();

// absolute RSVP URL; origin resolves on the client (this is a browser-only
// print view), mirroring the dashboard's copy-link behaviour
const origin = import.meta.client ? window.location.origin : "";
const rsvpUrl = (token: string) => `${origin}/?t=${token}`;

// batch = every party; ?party=<id> reprints a single one
const selected = computed(() => {
  const all = data.value?.parties ?? [];
  const only = route.query.party;
  return only ? all.filter((party) => String(party.id) === String(only)) : all;
});

interface Letter {
  party: Party;
  url: string;
  qr: string;
}
const letters = ref<Letter[]>([]);
async function buildLetters() {
  letters.value = await Promise.all(
    selected.value.map(async (party) => ({
      party,
      url: rsvpUrl(party.token),
      qr: await qrSvg(rsvpUrl(party.token)),
    })),
  );
}
await buildLetters();

// sheet stock is a screen-only preview control; ?sheet=a4 preselects it
const sheet = ref<"a5" | "a4">(route.query.sheet === "a4" ? "a4" : "a5");

// two A6 landscape letters stack into a 148 × 210 mm block: exactly A5, or
// centred on A4. An odd count leaves the second slot of the last sheet blank.
const sheets = computed(() => {
  const out: (Letter | null)[][] = [];
  for (let i = 0; i < letters.value.length; i += 2) {
    out.push([letters.value[i] ?? null, letters.value[i + 1] ?? null]);
  }
  return out;
});

// A4 only: printer's marks 1.5 mm outside the block's trim edges, positioned
// relative to the block (side edges at the top, the middle cut, and the bottom)
const cropMarks = (() => {
  const gap = 1.5;
  const tick = 5;
  const marks: { left: string; top: string; width: string; height: string }[] =
    [];
  for (const x of [0, 148]) {
    [0, 105, 210].forEach((y, row) => {
      marks.push({
        left: `${x === 0 ? x - gap - tick : x + gap}mm`,
        top: `${y}mm`,
        width: `${tick}mm`,
        height: "1px",
      });
      // the middle row's vertical ticks would land inside a letter
      if (row === 1) return;
      marks.push({
        left: `${x}mm`,
        top: `${row === 0 ? y - gap - tick : y + gap}mm`,
        width: "1px",
        height: `${tick}mm`,
      });
    });
  }
  return marks;
})();

// ponytail: placeholder invite copy — user supplies final wording during the
// content pass. Date and venue come from content. [[content-placeholders-pending]]
const inviteCopy =
  "We would be delighted for you to join us " +
  "as we celebrate our wedding. Please let us know if you can make it by scanning " +
  "the QR code below";
// RSVP deadline set by the admin in settings; blank until one is saved
const dateLine = computed(() => {
  const deadline = settings.value?.rsvpDeadline;
  if (!deadline) return "";
  return new Date(deadline).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});
</script>

<template>
  <div>
    <div
      v-if="letters.length"
      class="no-print flex items-center justify-center gap-3 p-4"
    >
      <span class="text-sm text-ink/60">Sheet</span>
      <div
        data-sheet-toggle
        class="inline-flex overflow-hidden rounded-full border border-ink/15"
      >
        <button
          v-for="size in (['a5', 'a4'] as const)"
          :key="size"
          type="button"
          :aria-pressed="sheet === size"
          class="px-4 py-1 text-sm"
          :class="sheet === size ? 'bg-petal text-white' : 'text-ink/70'"
          @click="sheet = size"
        >
          {{ size.toUpperCase() }}
        </button>
      </div>
    </div>

    <PrintPage
      v-for="(pair, pairIndex) in sheets"
      :key="pairIndex"
      :size="sheet"
      style="--page-pad: 0"
    >
      <div
        class="relative w-[148mm]"
        :class="sheet === 'a4' ? 'mx-auto mt-[43.5mm]' : ''"
      >
        <template v-for="(entry, slot) in pair" :key="slot">
          <article
            v-if="entry"
            data-letter
            class="relative h-[105mm] w-[148mm] overflow-hidden"
          >
            <div
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 z-0"
            >
              <FloralCluster
                class="absolute left-0 top-0 w-40 -translate-x-1/2 -translate-y-1/2 rotate-[135deg]"
              />
              <FloralTulipCorner
                class="absolute bottom-0 right-0 w-16 -scale-x-100"
              />
              <FloralDivider
                data-letter-divider
                class="absolute bottom-4 right-1/2 w-28 translate-x-1/2"
              />
            </div>

            <!-- QR column is fixed at 48 mm (35 mm code plus breathing room)
                 so the text column keeps the names on one line -->
            <div
              class="relative z-10 grid h-full grid-cols-[1fr_48mm] items-center gap-5 p-[8mm]"
            >
              <div>
                <div class="flex flex-col items-center text-center">
                  <p class="text-xs uppercase tracking-[0.35em] text-petal-deep">
                    You're invited
                  </p>
                  <h1 class="mt-2 font-display text-4xl font-light italic text-ink">
                    Ciera <span class="text-petal">&amp;</span> Martin
                  </h1>
                  <FloralDivider
                    data-letter-header-divider
                    class="mx-auto mt-1 w-28"
                  />
                </div>

                <p class="mt-4 font-display text-lg text-ink">
                  Dear {{ entry.party.name }},
                </p>
                <p class="mt-2 text-sm leading-relaxed text-ink/80">
                  {{ inviteCopy
                  }}<template v-if="dateLine"> by {{ dateLine }}</template
                  >.
                </p>
              </div>

              <div class="text-center">
                <!-- eslint-disable-next-line vue/no-v-html -- QR SVG generated locally by qrSvg -->
                <div
                  data-qr
                  class="mx-auto h-[35mm] w-[35mm]"
                  v-html="entry.qr"
                />
                <p class="mt-2 text-xs text-ink/60">Scan to RSVP, or visit</p>
                <p
                  data-fallback
                  class="break-all text-xs font-medium text-petal-deep"
                >
                  {{ entry.url }}
                </p>
              </div>
            </div>
          </article>
          <div v-else class="h-[105mm] w-[148mm]" />
        </template>

        <!-- A5: one dashed cut guide between the halves. A4: crop marks
             outside the trim, which is what a guillotine wants. -->
        <div
          v-if="sheet === 'a5'"
          data-cut
          class="absolute inset-x-0 top-[105mm] border-t border-dashed border-ink/25"
        />
        <template v-else>
          <span
            v-for="(mark, markIndex) in cropMarks"
            :key="markIndex"
            data-crop
            class="absolute bg-ink/50"
            :style="mark"
          />
        </template>
      </div>
    </PrintPage>

    <p v-if="!letters.length" class="no-print p-8 text-center text-ink/60">
      No parties to print yet.
    </p>
  </div>
</template>
