<script lang="ts" context="module">
  export const sensors = [
    "accelerometer",
    "accelerometer uncalibrated",
    "gravity",
    "gyroscope",
    "gyroscope uncalibrated",
    "linear acceleration",
    "rotation vector",
    "game rotation vector",
    "geomagnetic rotation vector",
    "magnetic field",
    "magnetic field uncalibrated",
    "orientation",
    "proximity",
    "light",
    "pressure",
    "ambient temperature",
    "relative humidity",
    "step counter",
  ];
</script>

<script lang="ts">
  import { ValidationMessage } from "@felte/reporter-svelte";

  export let setFields = (
    path: string,
    value: string[],
    shouldTouch?: boolean
  ) => {};
  export let selected: string[] = [];
  export let updateDirty = () => {};

  const onSelectAll = () => {
    let dirty = sensors.filter((it) => !selected.includes(it)).length > 0;
    setFields("android.sensors", [...sensors], true);
    if (dirty) {
      updateDirty();
    }
  };

  const onClear = () => {
    let dirty = selected.length > 0;
    setFields("android.sensors", []);
    if (dirty) {
      updateDirty();
    }
  };
</script>

<article class="border" aria-labelledby="android-sensors-group-title">
  <details open>
    <summary class="none">
      <div class="row">
        <h6 id="android-sensors-group-title">Android Sensors</h6>
        <div class="max" />
        <i>arrow_drop_down</i>
      </div>
    </summary>

    <ValidationMessage for="android.publisher" let:messages={message}>
      <div class="field label">
        <input type="text" name="android.publisher" id="publisher" />
        <label for="publisher">publisher</label>
        <span class="error">{message || ""}</span>
      </div>
    </ValidationMessage>

    <label class="switch icon">
      <input type="checkbox" name="android.map" aria-label="map pane switch" />
      <span>
        <i>map</i>
      </span>
      <div class="tooltip">map pane</div>
    </label>

    <label class="switch icon">
      <input type="checkbox" name="android.lte" aria-label="lte chart switch" />
      <span>
        <i>signal_cellular_alt</i>
      </span>
      <div class="tooltip">LTE chart</div>
    </label>

    <fieldset class="grid" aria-label="sensor list">
      {#each sensors as sensor}
        <label class="checkbox s12 m6 l3" aria-label={sensor}>
          <input type="checkbox" name="android.sensors" value={sensor} />
          <span>{sensor}</span>
        </label>
      {/each}
    </fieldset>

    <button
      class="round secondary"
      type="button"
      on:click={onSelectAll}
      aria-labelledby="btn-all-label"
    >
      <i>check_box</i>
      <span id="btn-all-label">Select All</span>
    </button>
    <button
      class="round secondary"
      type="button"
      on:click={onClear}
      aria-labelledby="btn-clear-label"
    >
      <i>check_box_outline_blank</i>
      <span id="btn-clear-label">Clear</span>
    </button>
  </details>
</article>

<style>
  .field.label > label {
    color: silver;
  }

  fieldset {
    margin: 0.9375rem;
    border-width: 0;
  }

  .checkbox + .checkbox {
    margin-left: 0;
  }
</style>
