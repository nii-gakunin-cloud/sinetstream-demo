<script lang="ts" context="module">
  export const fields = [
    "drift_x",
    "drift_y",
    "drift_z",
    "rotation_x",
    "rotation_y",
    "rotation_z",
  ];
  export const table: string = "gyroscope_uncalibrated";
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
  <YAxis title="rad/s" />
</Chart>
