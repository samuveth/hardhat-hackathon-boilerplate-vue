<template>
  <div class="mt-4 py-2 px-4 bg-red-200 rounded">
    Error sending transaction: {{ message.substring(0, 100) }}
  </div>
</template>

<script>
export default {
  props: ["message"],
};
</script>
