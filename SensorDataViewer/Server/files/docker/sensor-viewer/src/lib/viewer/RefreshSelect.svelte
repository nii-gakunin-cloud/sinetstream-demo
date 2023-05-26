<script lang="ts">
  import { findIndex, refreshInterval, refreshIntervals } from "./timeRange";

  let intervalIndex: number = findIndex($refreshInterval, refreshIntervals, 3);
  $: {
    $refreshInterval = refreshIntervals[intervalIndex];
  }
</script>

<div class="field suffix small l m">
  <select bind:value={intervalIndex}>
    {#each refreshIntervals as interval, idx}
      <option value={idx}>{interval.label}</option>
    {/each}
  </select>
  <i>arrow_drop_down</i>
</div>
