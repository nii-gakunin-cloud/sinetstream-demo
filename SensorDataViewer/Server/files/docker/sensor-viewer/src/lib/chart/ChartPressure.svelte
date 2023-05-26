<script lang="ts">
  import Chart from "./Chart.svelte";
  import YAxis from "./YAxis.svelte";
  import { toTitle } from "./chart";

  export const fields = ["value"];
  export const table = "pressure";
  export let from: Date;
  export let to: Date;
  export let rawData = [];
</script>

<Chart {fields} title={toTitle(table)} {from} {to} {rawData}>
  <slot />
  <YAxis title="hPa" />
</Chart>
