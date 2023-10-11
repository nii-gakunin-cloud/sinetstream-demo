<script lang="ts">
  import { format, formatISO, fromUnixTime } from "date-fns";
  import { onDestroy } from "svelte";
  import { settings, settingsIndex } from "../settings";
  import { current, fromTime, repeat, step, tick, toTime } from "./player";

  let playing = false;
  let interval = 0;
  $: {
    if ($current < $fromTime || $current > $toTime) {
      $current = $fromTime;
    }
  }

  const nextStep = () => {
    $current += $step;
    if ($current > $toTime) {
      if ($repeat) {
        $current = $fromTime;
      } else {
        $current = $toTime;
        playing = false;
      }
    }
  };

  const prevStep = () => {
    $current -= $step;
    if ($current < $fromTime) {
      $current = $fromTime;
    }
  };

  $: {
    if (playing) {
      if (interval === 0) {
        interval = window.setInterval(() => {
          nextStep();
        }, $tick);
      }
    } else {
      if (interval !== 0) {
        clearInterval(interval);
        interval = 0;
      }
    }
  }
  onDestroy(() => {
    if (interval !== 0) {
      clearInterval(interval);
      interval = 0;
    }
  });

  function setRepeat(value: boolean) {
    const setting = $settings[$settingsIndex];
    if (setting == null) {
      return;
    }
    const { player } = setting;
    if (player == null) {
      return;
    }
    player.repeat = value;
    $settings[$settingsIndex] = setting;
  }
</script>

<button class="l m circle transparent" disabled={playing} on:click={prevStep}
  ><i>skip_previous</i></button
>
{#if !playing}
  <button
    class="circle transparent"
    on:click={() => {
      playing = true;
    }}><i>play_arrow</i></button
  >
{:else}
  <button
    class="circle transparent"
    on:click={() => {
      playing = false;
    }}><i>pause</i></button
  >
{/if}
<button class="l m circle transparent" disabled={playing} on:click={nextStep}
  ><i>skip_next</i></button
>
<span class="l">{formatISO(fromUnixTime($current))}</span>
<span class="m">{format(fromUnixTime($current), "MM/dd HH:mm")}</span>
<input
  type="range"
  min={$fromTime}
  max={$toTime}
  step={$step}
  bind:value={$current}
/>

{#if $repeat}
  <button
    class="l circle transparent"
    on:click={() => {
      setRepeat(false);
    }}><i>repeat_on</i></button
  >
{:else}
  <button
    class="l circle transparent"
    on:click={() => {
      setRepeat(true);
    }}><i>repeat</i></button
  >
{/if}
