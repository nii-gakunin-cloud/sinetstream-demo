<script lang="ts" context="module">
  export const fields = ["reader_bytes_rate", "writer_bytes_rate"];
  export const table: string = "perftool";
</script>

<script lang="ts">
  import Chart from "./Chart.svelte";
  import YAxis from "./YAxis.svelte";
  import { toTitle } from "./chart";

  const title = toTitle(table);
  export let from: Date;
  export let to: Date;
  export let rawData: Record<string, any>[] = [];
</script>

<Chart {fields} {title} {from} {to} {rawData}>
  <slot />
  <YAxis title="bytes/s" type="bin_linear" />
</Chart>
