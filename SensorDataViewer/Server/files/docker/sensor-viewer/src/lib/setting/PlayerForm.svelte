<script lang="ts" context="module">
  import { compareAsc, parseISO } from "date-fns";

  export const validate = (values) => {
    const errors = {};
    const { from, to } = values;
    const fromTime = parseISO(from);
    const toTime = parseISO(to);
    if (compareAsc(fromTime, toTime) >= 0) {
      errors["from"] =
        "The 'From' date/time must be before the 'To' date/time.";
      errors["to"] =
        "The 'To' date/time must be later than the 'From' date/time.";
    }
    return { player: errors };
  };
</script>

<script lang="ts">
  import { ValidationMessage } from "@felte/reporter-svelte";
  import { mode } from "../settings";
</script>

<article class="border">
  <details open={$mode === "player"}>
    <summary class="none">
      <div class="row">
        <h6>Playback</h6>
        <div class="max" />
        <i>arrow_drop_down</i>
      </div>
    </summary>
    <ValidationMessage for="player.from" let:messages={message}>
      <div class="field label" class:invalid={message != null}>
        <input type="datetime-local" name="player.from" id="player-from" />
        <label for="player-from">From</label>
        <span class="error">{message || ""}</span>
      </div>
    </ValidationMessage>
    <ValidationMessage for="player.to" let:messages={message}>
      <div class="field label" class:invalid={message != null}>
        <input type="datetime-local" name="player.to" id="player-to" />
        <label for="player-to">To</label>
        <span class="error">{message || ""}</span>
      </div>
    </ValidationMessage>

    <div class="field label">
      <input
        type="number"
        name="player.tick"
        min={100}
        step={100}
        id="player-tick"
      />
      <label for="player-tick">Refresh interval</label>
      <span class="helper"> 次のデータを表示するまでの時間間隔(ミリ秒)。 </span>
    </div>

    <div class="field label">
      <input
        type="number"
        name="player.speed"
        min={1}
        max={20}
        id="player-speed"
      />
      <label for="player-speed">Granularity</label>
      <span class="helper">
        １ステップをどの程度の粗さにするかを示す指数。大きい値を指定するほど１ステップで進む時間幅が広くなる。
      </span>
    </div>

    <label class="checkbox">
      <input
        type="checkbox"
        name="player.repeat"
        aria-label="repeat checkbox"
      />
      <span>repeat</span>
    </label>
  </details>
</article>

<style>
  input::-webkit-calendar-picker-indicator {
    z-index: 1;
  }
</style>
