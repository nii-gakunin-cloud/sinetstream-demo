<script lang="ts">
  import BaseMapPane from "../pane/BaseMapPane.svelte";
  import { endTime, startTime, timeRange } from "./timeRange";

  export let height;
  export let width;
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
