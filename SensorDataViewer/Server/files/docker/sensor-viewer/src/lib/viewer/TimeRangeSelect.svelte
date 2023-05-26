<script lang="ts">
  import { findIndex, timeRange, timeRanges } from "./timeRange";

  let rangeIndex: number = findIndex($timeRange, timeRanges, 1);
  $: {
    $timeRange = timeRanges[rangeIndex];
  }
</script>

<div class="field suffix small">
  <select bind:value={rangeIndex}>
    {#each timeRanges as range, idx}
      <option value={idx}>{range.label}</option>
    {/each}
  </select>
  <i>arrow_drop_down</i>
</div>
