<script lang="ts">
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { chartMinSize } from "../chart/chart";
  import { charts, pane } from "../settings";
  import { chartColumns } from "./layout";

  export let panes;

  let mapHeight = $pane.image ? "calc(50vh - 2rem)" : "calc(100vh - 4rem)";
  let mapWidth = $charts.length > 0 ? "50vw" : "100vw";
  const chartHeight = "calc(100vh - 4rem)";
  let maxCols = 1;
  let chartWidth;

  $: {
    maxCols = chartColumns($charts.length, chartWidth, $chartMinSize.width);
  }

  function handleMessage(ev) {
    if ($pane.map) {
      const v0 = ev.detail[0].size;
      mapWidth = `calc(${v0}vw)`;
    }
  }
  function handleMessage2(ev) {
    if ($pane.image) {
      const v0 = ev.detail[0].size;
      mapHeight = `calc(${v0}vh - ${(4 * v0) / 100}rem)`;
    } else {
      mapHeight = "calc(100vh - 4rem)";
    }
  }
</script>

<Splitpanes
  style="height: calc(100vh - 4rem); width: 100vw"
  horizontal={false}
  on:resized={handleMessage}
>
  {#if $pane.map || $pane.image}
    <Pane>
      <Splitpanes horizontal={true} on:resized={handleMessage2}>
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
          <Pane>
            <svelte:component this={panes["image"]} />
          </Pane>
        {/if}
      </Splitpanes>
    </Pane>
  {/if}
  {#if $charts.length > 0}
    <Pane>
      <div
        bind:clientWidth={chartWidth}
        class="scroll"
        style:height={chartHeight}
        style:padding-bottom={0}
      >
        <svelte:component this={panes["chart"]} {maxCols} />
      </div>
    </Pane>
  {/if}
</Splitpanes>
