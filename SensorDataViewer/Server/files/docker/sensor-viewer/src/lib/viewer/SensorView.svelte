<script lang="ts">
  import BaseSensorView from "../pane/BaseSensorView.svelte";
  import ChartPane from "./ChartPane.svelte";
  import ImagePane from "./ImagePane.svelte";
  import MapPane from "./MapPane.svelte";

  let panes = {
    map: MapPane,
    image: ImagePane,
    chart: ChartPane,
  };
</script>

<BaseSensorView {panes} />
