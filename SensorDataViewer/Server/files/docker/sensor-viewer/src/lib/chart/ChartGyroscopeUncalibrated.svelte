<script lang="ts">
  import Chart from "./Chart.svelte";
  import YAxis from "./YAxis.svelte";
  import { toTitle } from "./chart";

  export const fields = [
    "drift_x",
    "drift_y",
    "drift_z",
    "rotation_x",
    "rotation_y",
    "rotation_z",
  ];
  export const table = "gyroscope_uncalibrated";
  export let from: Date;
  export let to: Date;
  export let rawData = [];
</script>

<Chart {fields} title={toTitle(table)} {from} {to} {rawData}>
  <slot />
  <YAxis title="rad/s" />
</Chart>
