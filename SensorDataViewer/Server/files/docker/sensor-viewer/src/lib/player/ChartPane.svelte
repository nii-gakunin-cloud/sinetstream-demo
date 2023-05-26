<script lang="ts">
  import { fromUnixTime } from "date-fns";
  import VerticalMarker from "../chart/VerticalMarker.svelte";
  import BaseChartPane from "../pane/BaseChartPane.svelte";
  import { current, fromTime, toTime } from "./player";

  export let maxCols = 4;
</script>

{#if $$slots.pane}
  <BaseChartPane
    {maxCols}
    from={fromUnixTime($fromTime)}
    to={fromUnixTime($toTime)}
  >
    <VerticalMarker name={"current"} value={fromUnixTime($current)} />
    <svelte:fragment slot="pane">
      <slot name="pane" />
    </svelte:fragment>
  </BaseChartPane>
{:else}
  <BaseChartPane
    {maxCols}
    from={fromUnixTime($fromTime)}
    to={fromUnixTime($toTime)}
  >
    <VerticalMarker name={"current"} value={fromUnixTime($current)} />
  </BaseChartPane>
{/if}
