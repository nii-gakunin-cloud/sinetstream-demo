<script lang="ts">
  import { setContext } from "svelte";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import {
    chartLineSettings,
    chartMinSize,
    chartPointSettings,
  } from "../chart/chart";
  import { charts, mode, perftoolName, publisher } from "../settings";
  import { timeRange, toResolution } from "../viewer/timeRange";
  import {
    setupComponents,
    updatePaneHeight,
    updateRowsCols,
    fetchQueryResult,
  } from "./chart";

  export let maxCols = 4;
  export let from: Date;
  export let to: Date;

  const { width: minWidth, height: minHeight } = $chartMinSize;
  const settings = {
    showLine: $chartLineSettings.enabled,
    borderWidth: $chartLineSettings.size,
    pointRadius: $chartPointSettings.enabled ? $chartPointSettings.size : 0,
  };
  setContext("chart-pane", {
    getMinSize: () => ({ minHeight, minWidth }),
    getSettings: () => settings,
  });

  let tables: Record<string, string> = {};
  let fields: Record<string, string[]> = {};
  let components: Record<string, any> = {};
  setupComponents($charts).then((result) => {
    ({ tables, fields, components } = result);
  });

  $: resolution = toResolution({ from, to, mode: $mode, range: $timeRange });
  $: queryResult = fetchQueryResult(
    tables,
    fields,
    resolution,
    from,
    to,
    $perftoolName,
    $publisher
  );
  let data: Record<string, Record<string, any>[]> = {};
  $: if ($queryResult?.data) {
    data = $queryResult.data;
  }

  let targets: string[] = [];
  $: targets = $$slots.pane ? ["_pane", ...$charts] : [...$charts];

  let paneViewWidth: number, paneViewHeight: number;
  let rows: number, cols: number, offset: number;
  $: ({ rows, cols, offset } = updateRowsCols(
    maxCols,
    targets.length,
    paneViewWidth,
    paneViewHeight
  ));
  $: paneHeight = updatePaneHeight(rows, minHeight, paneViewHeight);
</script>

<div
  style:height={"100%"}
  style:width={"100%"}
  bind:clientHeight={paneViewHeight}
  bind:clientWidth={paneViewWidth}
>
  {#if paneViewHeight != null && paneViewWidth != null}
    <Splitpanes horizontal={true} style={`height: ${paneHeight}`}>
      {#each [...Array(rows)].map((_, idx) => idx) as row}
        <Pane>
          <Splitpanes horizontal={false}>
            {#each [...Array(cols)].map((_, idx) => idx) as col}
              {@const idx = row * cols + col - offset}
              {@const name = targets[idx]}
              {#if name === "_pane"}
                <Pane>
                  <slot name="pane" />
                </Pane>
              {:else}
                {@const tableName = `${tables[name]}${resolution}`}
                {#if idx < targets.length && idx >= 0 && components[name] != null}
                  <Pane>
                    <svelte:component
                      this={components[name]}
                      {from}
                      {to}
                      rawData={data[tableName]}
                    >
                      <slot />
                    </svelte:component>
                  </Pane>
                {/if}
              {/if}
            {/each}
          </Splitpanes>
        </Pane>
      {/each}
    </Splitpanes>
  {/if}
</div>
