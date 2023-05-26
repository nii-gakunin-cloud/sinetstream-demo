<script lang="ts">
  import Chart from "./Chart.svelte";
  import YAxis from "./YAxis.svelte";
  import { toTitle } from "./chart";

  export const fields = [
    "geomagnetic_field_strength_x",
    "geomagnetic_field_strength_y",
    "geomagnetic_field_strength_z",
    "iron_bias_estimation_x",
    "iron_bias_estimation_y",
    "iron_bias_estimation_z",
  ];
  export const table = "magnetic_field_uncalibrated";
  export let from: Date;
  export let to: Date;
  export let rawData = [];
</script>

<Chart {fields} title={toTitle(table)} {from} {to} {rawData}>
  <slot />
  <YAxis title={"\u00b5T"} />
</Chart>
