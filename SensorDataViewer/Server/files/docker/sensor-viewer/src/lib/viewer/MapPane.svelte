<script lang="ts">
  import BaseMapPane from "../pane/BaseMapPane.svelte";
  import { endTime, startTime, timeRange } from "./timeRange";

  export let height: number;
  export let width: number;
  $: tablename = `location${$timeRange.resolution}`;
</script>

<BaseMapPane
  from={$startTime}
  to={$endTime}
  {tablename}
  {height}
  {width}
  showMarker={true}
/>
