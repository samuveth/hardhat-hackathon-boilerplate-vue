<template>
  <div class="space-y-4 mt-10">
    <h4 class="text-2xl">Transfer</h4>
    <div class="flex flex-col">
      <label for="amount">Amount of {{ symbol }}</label>
      <input
        type="number"
        name="amount"
        placeholder="1"
        v-model="amount"
        class="px-2 py-1 rounded"
      />
    </div>
    <div class="flex flex-col">
      <label for="to">Recipient address</label>
      <input
        type="text"
        name="to"
        placeholder="0x"
        v-model="to"
        class="px-2 py-1 rounded"
      />
    </div>
    <button
      @click="transfer()"
      class="px-4 py-2 bg-blue-500 text-white rounded"
    >
      Transfer
    </button>
  </div>
</template>

<script>
export default {
  props: ["symbol"],
  data() {
    return {
      amount: undefined,
      to: undefined,
    };
  },
  methods: {
    transfer() {
      this.$emit("transfer", this.to, this.amount);
    },
  },
};
</script>
