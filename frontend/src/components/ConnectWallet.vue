<template>
  <div class="flex flex-col items-center">
    <div class="text-center">
      <!-- Metamask network should be set to Localhost:8545. -->
      <NetworkErrorMessage v-if="networkError" :error="networkError" />
    </div>
    <div class="p-4 text-center">
      <p>Please connect to your wallet.</p>
      <button
        class="px-4 py-2 m-3 bg-blue-500 text-white rounded"
        @click="$emit('connect')"
      >
        Connect Wallet
      </button>
    </div>
  </div>
</template>

<script>
import NetworkErrorMessage from "./NetworkErrorMessage.vue";
export default {
  components: { NetworkErrorMessage },
  props: ["networkError"],
};
</script>
