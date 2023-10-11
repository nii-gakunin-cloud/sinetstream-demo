<script lang="ts">
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { chartMinSize } from "../chart/chart";
  import { charts, pane } from "../settings";
  import { chartColumns } from "./layout";

  export let panes: Record<string, any>;

  const mapHeight = "calc(100vh - 4rem)";
  let mapWidth = $pane.image && $charts.length > 0 ? "50vw" : "100vw";
  const chartHeight = "calc(100vh - 4rem)";
  let maxCols = 1;
  let chartWidth: number;

  $: {
    if (chartWidth != null) {
      maxCols = chartColumns($charts.length, chartWidth, $chartMinSize.width);
    }
  }

  function handleMessage(ev: CustomEvent) {
    if ($pane.map) {
      const v0 = ev.detail[0].size;
      mapWidth = `calc(${v0}vw)`;
    }
  }
</script>

<Splitpanes
  style="height: calc(100vh - 4rem); width: 100vw"
  horizontal={false}
  on:resized={handleMessage}
>
  {#if $pane.map}
    <Pane>
      <svelte:component
        this={panes["map"]}
        width={mapWidth}
        height={mapHeight}
      />
    </Pane>
  {/if}
  {#if $pane.image}
    {#if $charts.length > 0}
      <Pane>
        <div
          bind:clientWidth={chartWidth}
          class="scroll"
          style:height={chartHeight}
          style:padding-bottom={0}
        >
          {#if chartWidth != null}
            <svelte:component this={panes["chart"]} {maxCols}>
              <svelte:fragment slot="pane">
                <svelte:component this={panes["image"]} />
              </svelte:fragment>
            </svelte:component>
          {/if}
        </div>
      </Pane>
    {:else}
      <svelte:component this={panes["image"]} />
    {/if}
  {:else if $charts.length > 0}
    <Pane>
      <div
        bind:clientWidth={chartWidth}
        class="scroll"
        style:height={chartHeight}
        style:padding-bottom={0}
      >
        {#if chartWidth != null}
          <svelte:component this={panes["chart"]} {maxCols} />
        {/if}
      </div>
    </Pane>
  {/if}
</Splitpanes>
