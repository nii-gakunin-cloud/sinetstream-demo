<script lang="ts">
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { chartMinSize } from "../chart/chart";
  import { charts, pane } from "../settings";
  import { chartColumns } from "./layout";

  export let panes;

  let mapHeight =
    $charts.length > 0 ? "calc(50vh - 2rem)" : "calc(100vh - 4rem)";
  let mapWidth = $pane.image ? "50vw" : "100vw";
  let chartHeight =
    $pane.map || $pane.image ? "calc(50vh - 2rem)" : "calc(100vh - 4rem)";
  let maxCols = 1;
  let chartWidth;

  $: {
    maxCols = chartColumns($charts.length, chartWidth, $chartMinSize.width);
  }

  function handleMessage(ev) {
    if ($pane.map || $pane.image) {
      const v0 = ev.detail[0].size;
      const v1 = ev.detail.length > 1 ? ev.detail[1].size : 0;
      mapWidth = $pane.image ? "50vw" : "100vw";
      mapHeight = `calc(${v0}vh - ${(4 * v0) / 100}rem)`;
      chartHeight = `calc(${v1}vh - ${(4 * v1) / 100}rem)`;
    } else {
      chartHeight = `calc(100vh - 4rem)`;
    }
  }

  function handleMessage2(ev) {
    const v0 = ev.detail[0].size;
    mapWidth = `${v0}vw`;
  }
</script>

<Splitpanes
  style="height: calc(100vh - 4rem); width: 100vw"
  horizontal={true}
  on:resized={handleMessage}
>
  {#if $pane.map || $pane.image}
    <Pane>
      <Splitpanes horizontal={false} on:resize={handleMessage2}>
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
