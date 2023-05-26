<script lang="ts">
  import BaseChartPane from "../pane/BaseChartPane.svelte";
  import { endTime, startTime } from "./timeRange";

  export let maxCols = 4;
</script>

{#if $$slots.pane}
  <BaseChartPane {maxCols} from={$startTime} to={$endTime}>
    <svelte:fragment slot="pane">
      <slot name="pane" />
    </svelte:fragment>
  </BaseChartPane>
{:else}
  <BaseChartPane {maxCols} from={$startTime} to={$endTime} />
{/if}
