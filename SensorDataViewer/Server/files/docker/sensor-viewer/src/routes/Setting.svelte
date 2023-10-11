<script lang="ts">
  import { link } from "svelte-routing";
  import SettingForm from "../lib/setting/SettingForm.svelte";
  import { settings, settingsIndex } from "../lib/settings";

  export let id: number;
  let prevIndex: number;
  $: {
    prevIndex = $settingsIndex;
    $settingsIndex = id;
  }
</script>

<header class="primary">
  <nav>
    <h6 class="max">Settings</h6>
    <div class="max" />
    <div>
      {#if $settingsIndex < $settings.length}
        <a
          href={`/setting-upload/${$settingsIndex}`}
          use:link
          class="chip circle transparent"
        >
          <i>upload</i>
          <div class="tooltip bottom">upload</div>
        </a>
      {/if}
      <a
        href={`/setting-download/${$settingsIndex}`}
        use:link
        class="chip circle transparent"
      >
        <i>download</i>
        <div class="tooltip bottom">download</div>
      </a>
    </div>
  </nav>
</header>
<main class="responsive">
  <SettingForm {prevIndex} />
</main>

<style>
  main.responsive {
    min-height: calc(100vh - 4rem);
  }
</style>
