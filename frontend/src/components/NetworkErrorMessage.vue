<template>
  <div class="px-3 py-2 bg-red-200 rounded border border-red-300">
    {{ error }}
  </div>
</template>

<script>
export default {
  props: ["error"],
};
</script>
