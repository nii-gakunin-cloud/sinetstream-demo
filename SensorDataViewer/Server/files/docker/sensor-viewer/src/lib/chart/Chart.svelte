<script lang="ts">
  import { getContext, setContext } from "svelte";
  import { Scatter } from "svelte-chartjs";
  import Legend from "./Legend.svelte";
  import Title from "./Title.svelte";

  export let title: string;
  export let fields: string[] = [];
  export let rawData: Record<string, any>[] = [];
  export let from: Date;
  export let to: Date;

  const { getMinSize, getSettings } =
    getContext<Record<string, any>>("chart-pane");
  let { minHeight, minWidth } = getMinSize();

  let titleFontSize = 24;
  let showLegend = true;

  let data = { datasets: [] as any[] };
  $: if (Array.isArray(rawData)) {
    const newData = {
      datasets: fields.map((label) => ({
        label,
        data: rawData.map((it) => ({
          x: it.timestamp,
          y: it[label],
        })),
        ...getSettings(),
      })),
    };
    data = { ...newData };
  }

  let options: Record<string, any> = {
    scales: {
      x: {
        type: "time",
        min: undefined,
        max: undefined,
        time: {
          displayFormats: {
            hour: "MM/dd kk:00",
          },
        },
        grid: {
          tickColor: "rgba(128,128,128,0.5)",
        },
      },
      y: {
        grid: {
          color: "rgba(128,128,128,0.5)",
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    onResize: (_chart: unknown, size: Record<string, number>) => {
      showLegend = Array.isArray(data.datasets) && data.datasets.length > 1;
      if (size.height < 300) {
        titleFontSize = 18;
      } else if (size.width < 400) {
        titleFontSize = 18;
      } else {
        titleFontSize = 24;
      }
    },
  };
  setContext("chart", {
    updateOptions: (path: string, value: Record<string, any>) => {
      options = options;
      let { parent, name } = path.split(".").reduce(
        ({ target: tgt }, curr) => {
          let next = tgt[curr];
          if (next == null) {
            next = {};
            tgt[curr] = next;
          }
          return {
            parent: tgt,
            name: curr,
            target: next,
          };
        },
        { parent: options, name: "", target: options }
      );
      parent[name] = value;
    },
  });

  $: if (Array.isArray(data.datasets) && from != null && to != null) {
    options.scales.x = { ...options.scales.x, min: from, max: to };
  }

  let chartWidth: number;
  let chartHeight: number;
  let chartPadding: string;

  $: if (chartWidth <= 500 || chartHeight <= 400) {
    chartPadding = "8px";
  } else {
    chartPadding = "32px";
  }
</script>

<div
  class="sensor-chart"
  bind:clientWidth={chartWidth}
  bind:clientHeight={chartHeight}
  style={`--chart-padding: ${chartPadding}; --chart-min-height: ${minHeight}px; --chart-min-width: ${minWidth}px;`}
>
  <Scatter {data} {options} />
  <slot />
  {#if title != null}
    <Title text={title} size={titleFontSize} />
  {/if}
  <Legend visible={showLegend} />
</div>

<style>
  .sensor-chart {
    padding: var(--chart-padding);
    width: 100%;
    height: 100%;
    min-height: var(--chart-min-height);
    min-width: var(--chart-min-width);
  }
</style>
