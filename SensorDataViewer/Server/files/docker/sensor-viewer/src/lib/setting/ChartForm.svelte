<script lang="ts">
  import { ValidationMessage } from "@felte/reporter-svelte";
  import { limitMinHeight, limitMinWidth } from "../chart/chart";
</script>

<article class="border">
  <details>
    <summary class="none">
      <div class="row">
        <h6>Chart</h6>
        <div class="max" />
        <i>arrow_drop_down</i>
      </div>
    </summary>

    <article class="border">
      <div class="field middle-aligh">
        <nav>
          <div class="max">
            <h6>Line</h6>
          </div>
          <label class="switch">
            <input
              type="checkbox"
              name="chart.line.enabled"
              aria-label="chart line enabled"
            />
            <span />
          </label>
        </nav>
      </div>

      <ValidationMessage for="chart.line.size" let:messages={message}>
        <div class="field label">
          <input
            type="number"
            name="chart.line.size"
            id="line-width"
            min="1"
            max="5"
          />
          <label class="active" for="line-width">line width</label>
          <span class="error">{message || ""}</span>
        </div>
      </ValidationMessage>
    </article>

    <article class="border">
      <div class="field middle-aligh">
        <nav>
          <div class="max">
            <h6>Point</h6>
          </div>
          <label class="switch">
            <input
              type="checkbox"
              name="chart.point.enabled"
              aria-label="chart point enabled"
            />
            <span />
          </label>
        </nav>
      </div>

      <ValidationMessage for="chart.point.size" let:messages={message}>
        <div class="field label">
          <input
            type="number"
            name="chart.point.size"
            id="point-size"
            min="1"
            max="5"
          />
          <label class="active" for="point-size">point size</label>
          <span class="error">{message || ""}</span>
        </div>
      </ValidationMessage>
    </article>

    <article class="border">
      <h6>Minimum Size</h6>
      <ValidationMessage for="chart.minSize.width" let:messages={message}>
        <div class="field label" class:invalid={message != null}>
          <input
            type="number"
            name="chart.minSize.width"
            id="min-width"
            min={limitMinWidth}
            step={10}
          />
          <label for="min-width">width</label>
          <span class="error">{message || ""}</span>
        </div>
      </ValidationMessage>
      <ValidationMessage for="chart.minSize.height" let:messages={message}>
        <div class="field label" class:invalid={message != null}>
          <input
            type="number"
            name="chart.minSize.height"
            id="min-height"
            min={limitMinHeight}
            step={10}
          />
          <label for="min-height">height</label>
          <span class="error">{message || ""}</span>
        </div>
      </ValidationMessage>
    </article>
  </details>
</article>
