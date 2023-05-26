<script lang="ts">
  import { getContext } from "svelte";

  export let value;
  export let name;
  export let borderColor = "rgb(255, 99, 132)";
  export let borderWidth = 2;

  const { updateOptions } = getContext<Record<string, any>>("chart");

  $: {
    const opts = {
      type: "line",
      xMin: value,
      xMax: value,
      borderColor,
      borderWidth,
    };
    updateOptions(`plugins.annotation.annotations.${name}`, opts);
  }
</script>
