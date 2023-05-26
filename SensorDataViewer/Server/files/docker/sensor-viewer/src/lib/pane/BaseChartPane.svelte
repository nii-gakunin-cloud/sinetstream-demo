<script lang="ts">
  import { getContextClient, gql, queryStore } from "@urql/svelte";
  import { formatISO } from "date-fns";
  import { setContext } from "svelte";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import ChartAccelerometer from "../chart/ChartAccelerometer.svelte";
  import ChartAccelerometerUncalibrated from "../chart/ChartAccelerometerUncalibrated.svelte";
  import ChartAmbientTemperature from "../chart/ChartAmbientTemperature.svelte";
  import ChartGameRotationVector from "../chart/ChartGameRotationVector.svelte";
  import ChartGeomagneticRotationVector from "../chart/ChartGeomagneticRotationVector.svelte";
  import ChartGravity from "../chart/ChartGravity.svelte";
  import ChartGyroscope from "../chart/ChartGyroscope.svelte";
  import ChartGyroscopeUncalibrated from "../chart/ChartGyroscopeUncalibrated.svelte";
  import ChartLight from "../chart/ChartLight.svelte";
  import ChartLinearAcceleration from "../chart/ChartLinearAcceleration.svelte";
  import ChartLte from "../chart/ChartLte.svelte";
  import ChartMagneticField from "../chart/ChartMagneticField.svelte";
  import ChartMagneticFieldUncalibrated from "../chart/ChartMagneticFieldUncalibrated.svelte";
  import ChartOrientation from "../chart/ChartOrientation.svelte";
  import ChartPerftool from "../chart/ChartPerftool.svelte";
  import ChartPressure from "../chart/ChartPressure.svelte";
  import ChartProximity from "../chart/ChartProximity.svelte";
  import ChartRelativeHumidity from "../chart/ChartRelativeHumidity.svelte";
  import ChartRotationVector from "../chart/ChartRotationVector.svelte";
  import ChartStepCounter from "../chart/ChartStepCounter.svelte";
  import {
    chartLineSettings,
    chartMinSize,
    chartPointSettings,
  } from "../chart/chart";
  import { charts, mode, perftoolName, publisher } from "../settings";
  import { timeRange, toResolution } from "../viewer/timeRange";

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

  $: tables = {};
  $: fields = {};
  $: data = {};
  let queryTables = ["light(limit: 1) { timestamp }"];
  let querySig =
    "query($publisher: String, $from: timestamptz, $to: timestamptz)";
  let queryVars: Record<string, any> = {
    publisher: $publisher,
    from: formatISO(from),
    to: formatISO(to),
  };
  $: resolution = toResolution({ from, to, mode: $mode, range: $timeRange });
  $: if (Object.keys(tables).length > 0) {
    queryTables = Object.keys(tables).map((name) => {
      const tableName = `${tables[name]}${resolution}`;
      if (name !== "perftool") {
        return `
        ${tableName}(
          where: { publisher: { _eq: $publisher }, timestamp: {_gte: $from, _lte: $to} }
          order_by: { timestamp: asc }
        ) {
          timestamp
          ${fields[name].join(" ")}
        }
        `;
      } else {
        return `
        ${tableName}(
          where: { publisher: { _eq: "${$perftoolName}" }, timestamp: {_gte: $from, _lte: $to} }
          order_by: { timestamp: asc }
        ) {
          timestamp
          ${fields[name].join(" ")}
        }
        `;
      }
    });
    if (Object.keys(tables).filter((name) => name !== "perftool").length > 0) {
      querySig =
        "query($publisher: String, $from: timestamptz, $to: timestamptz)";
      queryVars = {
        publisher: $publisher,
        from: formatISO(from),
        to: formatISO(to),
      };
    } else {
      querySig = "query($from: timestamptz, $to: timestamptz)";
      queryVars = {
        from: formatISO(from),
        to: formatISO(to),
      };
    }
  }
  $: queryResult = queryStore({
    client: getContextClient(),
    query: gql`
      ${querySig} {
        ${queryTables.join("\n")}
      }
    `,
    variables: queryVars,
  });

  $: if ($queryResult.data) {
    data = $queryResult.data;
  }

  let targets = $$slots.pane ? ["_pane", ...$charts] : [...$charts];
  let rows = targets.length;
  let cols = 1;
  let offset = 0;
  $: {
    if (maxCols > 1) {
      rows = Math.ceil(targets.length / maxCols);
      cols = Math.ceil(targets.length / rows);
      let mod = targets.length % cols;
      offset = mod === 0 ? 0 : cols - mod;
    } else {
      rows = targets.length;
      cols = 1;
      offset = 0;
    }
  }

  let paneViewWidth;
  let paneViewHeight;
  let paneHeight;
  $: if (paneViewHeight) {
    const minSize = minHeight * rows + 6 * (rows - 1);
    if (paneViewHeight >= minSize) {
      paneHeight = "100%";
    } else {
      paneHeight = `${minSize}px`;
    }
  }
</script>

<div
  style:height={"100%"}
  style:width={"100%"}
  bind:clientHeight={paneViewHeight}
  bind:clientWidth={paneViewWidth}
>
  <Splitpanes horizontal={true} style={`height: ${paneHeight}`}>
    {#each [...Array(rows)].map((_, idx) => idx) as row}
      <Pane>
        <Splitpanes horizontal={false}>
          {#each [...Array(cols)].map((_, idx) => idx) as col}
            {@const idx = row * cols + col - offset}
            {#if row * cols < targets.length && idx >= 0}
              {@const name = targets[idx]}
              {@const tableName = `${tables[name]}${resolution}`}
              <Pane>
                {#if name === "_pane"}
                  <slot name="pane" />
                {:else if name === "lte"}
                  <ChartLte
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartLte>
                {:else if name === "perftool"}
                  <ChartPerftool
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartPerftool>
                {:else if name === "accelerometer"}
                  <ChartAccelerometer
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartAccelerometer>
                {:else if name === "accelerometer uncalibrated"}
                  <ChartAccelerometerUncalibrated
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartAccelerometerUncalibrated>
                {:else if name === "gravity"}
                  <ChartGravity
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartGravity>
                {:else if name === "gyroscope"}
                  <ChartGyroscope
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartGyroscope>
                {:else if name === "gyroscope uncalibrated"}
                  <ChartGyroscopeUncalibrated
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartGyroscopeUncalibrated>
                {:else if name === "linear acceleration"}
                  <ChartLinearAcceleration
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartLinearAcceleration>
                {:else if name === "rotation vector"}
                  <ChartRotationVector
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartRotationVector>
                {:else if name === "game rotation vector"}
                  <ChartGameRotationVector
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartGameRotationVector>
                {:else if name === "geomagnetic rotation vector"}
                  <ChartGeomagneticRotationVector
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartGeomagneticRotationVector>
                {:else if name === "magnetic field"}
                  <ChartMagneticField
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartMagneticField>
                {:else if name === "magnetic field uncalibrated"}
                  <ChartMagneticFieldUncalibrated
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartMagneticFieldUncalibrated>
                {:else if name === "orientation"}
                  <ChartOrientation
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartOrientation>
                {:else if name === "proximity"}
                  <ChartProximity
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartProximity>
                {:else if name === "light"}
                  <ChartLight
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartLight>
                {:else if name === "pressure"}
                  <ChartPressure
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartPressure>
                {:else if name == "rotation vector"}
                  <ChartRotationVector
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartRotationVector>
                {:else if name === "relative humidity"}
                  <ChartRelativeHumidity
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartRelativeHumidity>
                {:else if name === "ambient temperature"}
                  <ChartAmbientTemperature
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartAmbientTemperature>
                {:else if name === "step counter"}
                  <ChartStepCounter
                    {from}
                    {to}
                    bind:table={tables[name]}
                    bind:fields={fields[name]}
                    rawData={data[tableName]}
                  >
                    <slot />
                  </ChartStepCounter>
                {/if}
              </Pane>
            {/if}
          {/each}
        </Splitpanes>
      </Pane>
    {/each}
  </Splitpanes>
</div>
