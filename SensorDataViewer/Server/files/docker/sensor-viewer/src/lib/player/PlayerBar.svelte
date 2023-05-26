<script lang="ts">
  import { link } from "svelte-routing";
  import NavigationDrawer from "../NavigationDrawer.svelte";
  import { currentSetting, settingsIndex } from "../settings";
  import Player from "./Player.svelte";

  let menu = false;
</script>

<NavigationDrawer bind:visible={menu} />

<header class="primary">
  <nav>
    <button
      class="circle transparent"
      type="button"
      on:click={() => {
        menu = true;
      }}><i>menu</i></button
    >
    <h6>{$currentSetting?.name}</h6>
    <div class="max l m" />
    <Player />
    <div class="l m">
      <a href={`/setting/${$settingsIndex}`} use:link>
        <button class="circle transparent"><i>settings</i></button>
      </a>
    </div>
  </nav>
</header>
