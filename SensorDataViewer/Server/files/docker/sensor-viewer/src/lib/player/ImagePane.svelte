<script lang="ts">
  import { fromUnixTime } from "date-fns";
  import BaseImagePane from "../pane/BaseImagePane.svelte";
  import { current, fromTime } from "./player";
</script>

<BaseImagePane
  from={fromUnixTime($fromTime)}
  to={fromUnixTime($current)}
  responsive={true}
/>
