<script lang="ts">
  import PlayerBar from "../lib/player/PlayerBar.svelte";
  import SensorView from "../lib/player/SensorView.svelte";
  import { mode, settingsIndex } from "../lib/settings";

  export let id;
  $: {
    $settingsIndex = id;
    $mode = "player";
  }
</script>

<PlayerBar />
<SensorView />
