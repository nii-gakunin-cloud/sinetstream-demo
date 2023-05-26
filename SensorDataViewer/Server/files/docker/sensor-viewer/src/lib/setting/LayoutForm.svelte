<script lang="ts">
  import HorizontalLayoutIcon from "./layout/HorizontalLayoutIcon.svelte";
  import Vertical2LayoutIcon from "./layout/Vertical2LayoutIcon.svelte";
  import VerticalHorizontalLayoutIcon from "./layout/VerticalHorizontalLayoutIcon.svelte";
  import VerticalLayoutIcon from "./layout/VerticalLayoutIcon.svelte";
</script>

<article class="border">
  <details open>
    <summary class="none">
      <div class="row">
        <h6>Layout</h6>
        <div class="max" />
        <i>arrow_drop_down</i>
      </div>
    </summary>

    <div class="field middle-align">
      <nav style:padding-top={"1rem"}>
        <label class="radio">
          <input
            type="radio"
            name="layout.template"
            value="horizontal"
            aria-label="horizontal"
          />
          <HorizontalLayoutIcon />
        </label>
        <label class="radio">
          <input
            type="radio"
            name="layout.template"
            value="vertical-horizontal"
            aria-label="vertical-horizontal"
          />
          <VerticalHorizontalLayoutIcon />
        </label>
        <label class="radio">
          <input
            type="radio"
            name="layout.template"
            value="vertical"
            aria-label="vertical"
          />
          <VerticalLayoutIcon />
        </label>
        <label class="radio">
          <input
            type="radio"
            name="layout.template"
            value="vertical-2"
            aria-label="vertical-2"
          />
          <Vertical2LayoutIcon />
        </label>
      </nav>
    </div>
  </details>
</article>
