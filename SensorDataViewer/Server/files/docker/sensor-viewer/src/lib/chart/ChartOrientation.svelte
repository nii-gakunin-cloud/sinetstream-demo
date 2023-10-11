<script lang="ts" context="module">
  export const fields = ["x", "y", "z"];
  export const table: string = "orientation";
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
  <YAxis title={"degree(\u00b0)"} />
</Chart>
