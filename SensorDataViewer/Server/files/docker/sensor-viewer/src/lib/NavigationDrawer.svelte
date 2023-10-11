<script lang="ts">
  import { link } from "svelte-routing";
  import { mode, settings, settingsIndex } from "./settings";

  export let visible = false;

  const onClick = (ev: MouseEvent) => {
    if (visible) {
      let tgt = ev?.target as Element | null;
      if (tgt?.closest("dialog") == null && tgt?.closest("button") == null) {
        visible = false;
      }
    }
  };

  const onKeydown = (ev: KeyboardEvent) => {
    if (visible && ev.key === "Escape") {
      visible = false;
    }
  };
</script>

<svelte:window on:click={onClick} on:keydown={onKeydown} />

<dialog class="left" class:active={visible}>
  <a class="row round" href={`/viewer/${$settingsIndex}`} use:link>
    <i>update</i>
    <span>live</span>
    {#if $mode === "viewer"}
      <div class="max" />
      <i>done</i>
    {/if}
  </a>
  <a
    class="row round"
    href={`/player/${$settingsIndex}`}
    use:link
    on:click={() => {
      visible = false;
    }}
  >
    <i>play_circle</i>
    <span>playback</span>
    {#if $mode === "player"}
      <div class="max" />
      <i>done</i>
    {/if}
  </a>
  <div class="small-divider" />

  {#each $settings as setting, idx}
    <a
      class="row round"
      href={`/${$mode}/${idx}`}
      use:link
      on:click={() => {
        visible = false;
      }}
    >
      <i>dashboard</i>
      <span>{setting.name}</span>
      {#if idx === Number($settingsIndex)}
        <div class="max" />
        <i>done</i>
      {/if}
    </a>
  {/each}

  <a class="row round" href={`/setting/${$settings.length}`} use:link>
    <i>dashboard_customize</i>
    <span>New Dashboard</span>
  </a>

  <div class="small-divider" />

  <a class="row round" href={`/setting/${$settingsIndex}`} use:link>
    <i>settings</i>
    <span>Settings</span>
  </a>
</dialog>

<style>
  dialog {
    z-index: 1100;
  }
</style>
