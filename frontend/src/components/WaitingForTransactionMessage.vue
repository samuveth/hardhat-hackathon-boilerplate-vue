<template>
  <div class="mt-4 py-2 px-4 bg-yellow-200 rounded">
    Waiting for transaction <b>{{ txHash }}</b> to be mined.
  </div>
</template>

<script>
export default {
  props: ["txHash"],
};
</script>
