<script lang="ts">
  import { getContext } from "svelte";

  export let position = "bottom";
  export let visible = true;

  const { updateOptions } = getContext<Record<string, any>>("chart");

  $: {
    updateOptions("plugins.legend", {
      position,
      display: visible,
    });
  }
</script>
