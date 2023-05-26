<script lang="ts">
  import { ValidationMessage } from "@felte/reporter-svelte";
</script>

<article class="border" aria-labelledby="perftool-group-title">
  <details open>
    <summary class="none">
      <div class="row">
        <h6 id="perftool-group-title">Perftool</h6>
        <div class="max" />
        <i>arrow_drop_down</i>
      </div>
    </summary>

    <ValidationMessage for="perftool.name" let:messages={message}>
      <div class="field label">
        <input type="text" name="perftool.name" id="perftool-name" />
        <label for="perftool-name">perftool name</label>
        <span class="error">{message || ""}</span>
      </div>
    </ValidationMessage>

    <label class="switch icon">
      <input
        type="checkbox"
        name="perftool.visible"
        aria-label="perftool chart switch"
      />
      <span>
        <i>show_chart</i>
      </span>
      <div class="tooltip">perftool chart</div>
    </label>
  </details>
</article>

<style>
  .field.label > label {
    color: silver;
  }
</style>
