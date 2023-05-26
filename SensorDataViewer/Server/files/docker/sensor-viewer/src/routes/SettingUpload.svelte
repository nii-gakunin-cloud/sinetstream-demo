<script lang="ts">
  import UploadSettingForm from "../lib/setting/server/UploadSettingForm.svelte";
  import { currentSetting, settingsIndex } from "../lib/settings";

  export let id;
  let prevIndex;
  $: {
    prevIndex = $settingsIndex;
    $settingsIndex = id;
  }
</script>

<header class="primary">
  <nav>
    <h6 class="max">Upload Settings: {$currentSetting?.name}</h6>
  </nav>
</header>
<main class="responsive">
  <UploadSettingForm />
</main>

<style>
  main.responsive {
    min-height: calc(100vh - 4rem);
  }
</style>
