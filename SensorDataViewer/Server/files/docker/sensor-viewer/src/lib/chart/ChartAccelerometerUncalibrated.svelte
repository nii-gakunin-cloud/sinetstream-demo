<script lang="ts" context="module">
  export const fields = [
    "x_with_compensation",
    "y_with_compensation",
    "z_with_compensation",
    "x_without_compensation",
    "y_without_compensation",
    "z_without_compensation",
  ];
  export const table: string = "accelerometer_uncalibrated";
</script>

<script lang="ts">
  import Chart from "./Chart.svelte";
  import YAxis from "./YAxis.svelte";
  import { toTitle } from "./chart";

  export let from: Date;
  export let to: Date;
  export let rawData: Record<string, any>[] = [];
</script>

<Chart {fields} title={toTitle(table)} {from} {to} {rawData}>
  <slot />
  <YAxis title={"m/s\u00b2"} />
</Chart>
