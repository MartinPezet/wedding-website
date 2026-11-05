<script setup lang="ts">
import { rooms as roomContent } from "#shared/content";

const props = defineProps<{
  total: number;
  partyId: number;
  monzoLinkEnabled: boolean;
  paymentDeadlineLabel: string;
}>();

// copy value is what a banking app wants pasted; display may be prettier
const bankDetails = computed(() => {
  const { name, sortCode, accountNumber } = roomContent.bankTransfer;
  const reference = paymentReference(props.partyId);
  return [
    { field: "name", label: "Name", value: name, display: name },
    {
      field: "sort-code",
      label: "Sort code",
      value: sortCode,
      display: sortCode.replace(/(\d{2})(?=\d)/g, "$1-"),
    },
    { field: "account", label: "Account number", value: accountNumber, display: accountNumber },
    { field: "reference", label: "Reference", value: reference, display: reference },
  ];
});

const copiedField = ref("");
async function copyDetail(field: string, value: string) {
  await navigator.clipboard.writeText(value);
  copiedField.value = field;
  setTimeout(() => {
    copiedField.value = "";
  }, 1500);
}
</script>

<template>
  <div class="mt-6 rounded-2xl border border-petal/40 bg-white/70 px-5 py-4 text-left">
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
        v-if="monzoLinkEnabled"
        data-monzo-link
        :href="monzoLink(total, partyId)"
        target="_blank"
        rel="noopener"
        class="rounded-full bg-leaf-deep px-5 py-2.5 font-display text-sm text-cream transition hover:bg-leaf"
      >
        Pay here
      </a>
    </div>
    <div class="mt-4 border-t border-petal/30 pt-4">
      <p class="text-sm text-leaf-deep">
        Or pay by bank transfer - please use your reference so we can
        match it to you.
      </p>
      <dl class="mt-3 flex flex-col gap-2">
        <div
          v-for="detail in bankDetails"
          :key="detail.field"
          :data-bank-detail="detail.field"
          class="flex items-center justify-between gap-3"
        >
          <dt class="text-xs uppercase tracking-widest text-petal-deep">
            {{ detail.label }}
          </dt>
          <dd class="flex items-center gap-3">
            <span class="font-display text-ink">{{ detail.display }}</span>
            <button
              data-copy
              type="button"
              :aria-label="`Copy ${detail.label.toLowerCase()}`"
              class="rounded-full border border-leaf/40 px-3 py-1 text-xs text-leaf-deep transition hover:border-petal hover:text-petal"
              @click="copyDetail(detail.field, detail.value)"
            >
              {{ copiedField === detail.field ? "Copied" : "Copy" }}
            </button>
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
