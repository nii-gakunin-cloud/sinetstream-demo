<script lang="ts">
  import { getContext } from "svelte";
  import { formKey, itemKey } from "./server";

  const { getParent } = getContext<Record<string, any>>(itemKey);
  const { targets } = getContext<Record<string, any>>(formKey);

  export let value: any = null;
</script>

<div class="row">
  <div />
  <div>
    {#if $targets.includes(getParent())}
      <i>check_circle</i>
    {:else}
      <i>unpublished</i>
    {/if}
  </div>
  <div>
    {#if value != null}
      <slot />: {JSON.stringify(value)}
    {:else}
      <slot />
    {/if}
  </div>
</div>
