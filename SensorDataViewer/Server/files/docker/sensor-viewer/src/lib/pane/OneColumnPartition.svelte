<script lang="ts">
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { charts, pane } from "../settings";

  export let panes;

  let initPanes = 0;
  if ($charts.length > 0) {
    initPanes += 1;
  }
  if ($pane.map) {
    initPanes += 1;
  }
  if ($pane.image) {
    initPanes += 1;
  }
  let initHeight;
  switch (initPanes) {
    case 3:
      initHeight = "calc(33vh - 1.3125rem)";
      break;
    case 2:
      initHeight = "calc(50vh - 2rem)";
      break;
    case 1:
      initHeight = "calc(100vh - 4rem)";
      break;
  }
  let mapHeight = initHeight;
  let chartHeight = initHeight;

  function handleMessage(ev) {
    if ($pane.map) {
      const v = ev.detail[0].size;
      mapHeight = `calc(${v}vh - ${(4 * v) / 100}rem)`;
    }
    if ($charts.length > 0) {
      const v = ev.detail.at(-1).size;
      chartHeight = `calc(${v}vh - ${(4 * v) / 100}rem)`;
    }
  }
</script>

<Splitpanes
  style="height: calc(100vh - 4rem); width: 100vw"
  horizontal={true}
  on:resized={handleMessage}
>
  {#if $pane.map}
    <Pane>
      <svelte:component
        this={panes["map"]}
        width={"100vw"}
        height={mapHeight}
      />
    </Pane>
  {/if}
  {#if $pane.image}
    <Pane>
      <svelte:component this={panes["image"]} />
    </Pane>
  {/if}
  {#if $charts.length > 0}
    <Pane>
      <div class="scroll" style:height={chartHeight} style:padding-bottom={0}>
        <svelte:component this={panes["chart"]} maxCols={1} />
      </div>
    </Pane>
  {/if}
</Splitpanes>
