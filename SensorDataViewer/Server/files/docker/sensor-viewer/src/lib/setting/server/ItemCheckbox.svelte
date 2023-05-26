<script lang="ts">
  import { setContext } from "svelte";
  import { itemKey } from "./server";

  export let name = "targets";
  export let value: string;

  setContext(itemKey, { getParent: () => value });
</script>

<div class="row">
  <label class="checkbox">
    <input type="checkbox" {name} {value} />
    <span />
  </label>
  <div><slot name="label" /></div>
</div>

<slot />
