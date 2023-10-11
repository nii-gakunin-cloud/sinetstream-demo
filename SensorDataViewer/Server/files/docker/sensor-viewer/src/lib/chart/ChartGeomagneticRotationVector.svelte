<script lang="ts" context="module">
  export const fields = ["x", "y", "z"];
  export const table: string = "geomagnetic_rotation_vector";
</script>

<script lang="ts">
  import Chart from "./Chart.svelte";
  import { toTitle } from "./chart";

  export let from: Date;
  export let to: Date;
  export let rawData: Record<string, any>[] = [];
</script>

<Chart {fields} title={toTitle(table)} {from} {to} {rawData}>
  <slot />
</Chart>
