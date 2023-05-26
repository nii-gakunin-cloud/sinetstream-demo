<script lang="ts">
  import { string } from "zod";

  export let Component;
  export let parameters: Record<string, any> = {};
</script>

<svelte:component this={Component} {...parameters}>
  <div data-testid="default-slot">default slot</div>
  <span data-testid="label-slot" slot="label">label slot</span>
</svelte:component>
