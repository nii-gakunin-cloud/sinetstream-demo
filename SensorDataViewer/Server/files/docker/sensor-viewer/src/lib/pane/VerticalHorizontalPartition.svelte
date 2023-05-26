<script lang="ts">
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { chartMinSize } from "../chart/chart";
  import { charts, pane } from "../settings";
  import { chartColumns } from "./layout";

  export let panes;

  const mapHeight = "calc(100vh - 4rem)";
  let mapWidth = $pane.image && $charts.length > 0 ? "50vw" : "100vw";
  let chartHeight = $pane.image ? "calc(50vh - 2rem)" : "calc(100vh - 4rem)";
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
      const v1 = ev.detail.length > 1 ? ev.detail[1].size : 0;
      chartHeight = `calc(${v1}vh - ${(4 * v1) / 100}rem)`;
    } else {
      chartHeight = "calc(100vh - 4rem)";
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
  {#if $pane.image || $charts.length > 0}
    <Pane>
      <Splitpanes horizontal={true} on:resize={handleMessage2}>
        {#if $pane.image}
          <Pane>
            <svelte:component this={panes["image"]} />
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
    </Pane>
  {/if}
</Splitpanes>
