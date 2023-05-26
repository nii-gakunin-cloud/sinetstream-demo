<script lang="ts">
  import { getContext } from "svelte";

  export let title: string;
  export let gridColor = "rgba(128,128,128,0.5)";
  export let type = "linear";

  const { updateOptions } = getContext<Record<string, any>>("chart");

  $: {
    const scaleY = {
      grid: {
        color: gridColor,
      },
      type,
    };
    if (title != null) {
      scaleY["title"] = {
        text: title,
        display: true,
      };
    }
    updateOptions("scales.y", scaleY);
  }
</script>
