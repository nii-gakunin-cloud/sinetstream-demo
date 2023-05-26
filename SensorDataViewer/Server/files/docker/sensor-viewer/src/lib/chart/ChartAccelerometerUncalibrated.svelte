<script lang="ts">
  import Chart from "./Chart.svelte";
  import YAxis from "./YAxis.svelte";
  import { toTitle } from "./chart";

  export const fields = [
    "x_with_compensation",
    "y_with_compensation",
    "z_with_compensation",
    "x_without_compensation",
    "y_without_compensation",
    "z_without_compensation",
  ];
  export const table = "accelerometer_uncalibrated";
  export let from: Date;
  export let to: Date;
  export let rawData = [];
</script>

<Chart {fields} title={toTitle(table)} {from} {to} {rawData}>
  <slot />
  <YAxis title={"m/s\u00b2"} />
</Chart>
