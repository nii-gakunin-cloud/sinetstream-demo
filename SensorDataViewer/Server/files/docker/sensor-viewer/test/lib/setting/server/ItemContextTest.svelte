<script lang="ts" context="module">
  export const DEFAULT_TEXT = "default slot";
</script>

<script lang="ts">
  import { setContext } from "svelte";
  import type { Readable } from "svelte/store";
  import { formKey, itemKey } from "../../../../src/lib/setting/server/server";

  export let value: string;
  export let targets: Readable<string[]>;
  export let Component;
  export let updateTargets: any = undefined;
  export let props: Record<string, any> = {};
  export let emptySlot = false;

  setContext(itemKey, { getParent: () => value });
  setContext(formKey, { updateTargets, targets });

  const { text, ...other } = props;
</script>

{#if !emptySlot}
  <svelte:component this={Component} {...other}>
    {#if text}
      {text}
    {:else}
      {DEFAULT_TEXT}
    {/if}
  </svelte:component>
{:else}
  <svelte:component this={Component} {...other} />
{/if}
