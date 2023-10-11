<script lang="ts">
  import DownloadSettingForm from "../lib/setting/server/DownloadSettingForm.svelte";
  import { currentSetting, settingsIndex } from "../lib/settings";

  export let id: number;
  let prevIndex;
  $: {
    prevIndex = $settingsIndex;
    $settingsIndex = id;
  }
</script>

<header class="primary">
  <nav>
    <h6 class="max">Download Settings: {$currentSetting?.name}</h6>
  </nav>
</header>
<main class="responsive">
  <DownloadSettingForm />
</main>

<style>
  main.responsive {
    min-height: calc(100vh - 4rem);
  }
</style>
