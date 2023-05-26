<script lang="ts">
  import { getContext } from "svelte";

  export let text: string;
  export let size = 24;
  export let visible = true;

  const { updateOptions } = getContext<Record<string, any>>("chart");

  $: {
    updateOptions("plugins.title", {
      text,
      display: visible,
      font: { size },
    });
  }
</script>
