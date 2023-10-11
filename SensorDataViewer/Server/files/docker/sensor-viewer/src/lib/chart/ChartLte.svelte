<script lang="ts" context="module">
  export const fields = ["rssi", "rsrp", "rsrq", "rssnr"];
  export const table: string = "lte";
</script>

<script lang="ts">
  import Chart from "./Chart.svelte";
  import YAxis from "./YAxis.svelte";

  export let from: Date;
  export let to: Date;
  export let rawData: Record<string, any>[] = [];
</script>

<Chart {fields} title="LTE" {from} {to} {rawData}>
  <slot />
  <YAxis title="rssi, rsrp(dBm) / rsrq, rssnr(dB)" />
</Chart>
