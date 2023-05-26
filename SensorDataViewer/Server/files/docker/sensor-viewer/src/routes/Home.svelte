<script lang="ts">
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import { settings, mode } from "../lib/settings";

  onMount(() => {
    if ($settings.length > 0) {
      navigate(`/${$mode != null ? $mode : "viewer"}/0`, { replace: true });
    } else {
      navigate("/setting/0", { replace: true });
    }
  });
</script>

<div>home</div>
