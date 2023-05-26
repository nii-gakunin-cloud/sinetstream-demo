<script lang="ts">
  import { ValidationMessage } from "@felte/reporter-svelte";
</script>

<article class="border" aria-labelledby="picamera-group-title">
  <details open>
    <summary class="none">
      <div class="row">
        <h6 id="picamera-group-title">Raspberry Pi Camera</h6>
        <div class="max" />
        <i>arrow_drop_down</i>
      </div>
    </summary>

    <ValidationMessage for="image.topic" let:messages={message}>
      <div class="field label">
        <input type="text" name="image.topic" id="image-topic" />
        <label for="image-topic">image topic name</label>
        <span class="error">{message || ""}</span>
      </div>
    </ValidationMessage>

    <label class="switch icon">
      <input
        type="checkbox"
        name="image.visible"
        aria-label="image pane switch"
      />
      <span>
        <i>image</i>
      </span>
      <div class="tooltip">image pane</div>
    </label>

    <div class="field middle-align" style:margin-bottom="1rem">
      <label class="radio">
        <input
          type="radio"
          name="image.update"
          value="push"
          aria-label="radio push"
        />
        <span>push</span>
      </label>
      <label class="radio">
        <input
          type="radio"
          name="image.update"
          value="polling"
          aria-label="radio polling"
        />
        <span>polling</span>
      </label>
      <span class="helper">update method</span>
    </div>
  </details>
</article>

<style>
  .field.label > label {
    color: silver;
  }
</style>
