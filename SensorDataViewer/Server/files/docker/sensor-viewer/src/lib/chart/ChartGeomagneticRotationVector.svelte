<script lang="ts">
  import Chart from "./Chart.svelte";
  import { toTitle } from "./chart";

  export const fields = ["x", "y", "z"];
  export const table = "geomagnetic_rotation_vector";
  export let from: Date;
  export let to: Date;
  export let rawData = [];
</script>

<Chart {fields} title={toTitle(table)} {from} {to} {rawData}>
  <slot />
</Chart>
