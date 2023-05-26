<script lang="ts">
  import BaseImagePane from "../pane/BaseImagePane.svelte";
  import { endTime, startTime } from "./timeRange";
</script>

<BaseImagePane from={$startTime} to={$endTime} />
