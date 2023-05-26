<script lang="ts">
  import Chart from "./Chart.svelte";
  import YAxis from "./YAxis.svelte";

  export const fields = ["rssi", "rsrp", "rsrq", "rssnr"];
  export const table = "lte";
  export let from: Date;
  export let to: Date;
  export let rawData = [];
</script>

<Chart {fields} title="LTE" {from} {to} {rawData}>
  <slot />
  <YAxis title="rssi, rsrp(dBm) / rsrq, rssnr(dB)" />
</Chart>
