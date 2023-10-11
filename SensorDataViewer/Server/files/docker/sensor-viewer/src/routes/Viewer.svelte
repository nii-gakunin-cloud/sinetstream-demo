<script lang="ts">
  import { mode, settingsIndex } from "../lib/settings";
  import SensorView from "../lib/viewer/SensorView.svelte";
  import ViewerBar from "../lib/viewer/ViewerBar.svelte";

  export let id: number;
  $: {
    $settingsIndex = id;
    $mode = "viewer";
  }
</script>

<ViewerBar />
<SensorView />
