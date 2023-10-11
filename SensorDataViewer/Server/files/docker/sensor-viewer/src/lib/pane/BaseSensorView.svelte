<script lang="ts">
  import HorizontalPartition from "./HorizontalPartition.svelte";
  import { layoutTemplate } from "./layout";
  import OneColumnPartition from "./OneColumnPartition.svelte";
  import VerticalHorizontalPartition from "./VerticalHorizontalPartition.svelte";
  import VerticalPartition from "./VerticalPartition.svelte";
  import VerticalPartition2 from "./VerticalPartition2.svelte";

  export let panes: Record<string, any>;

  let clientWidth: number;
</script>

<div bind:clientWidth>
  {#if clientWidth != null}
    {#if clientWidth <= 600}
      <OneColumnPartition {panes} />
    {:else if $layoutTemplate === "vertical"}
      <VerticalPartition {panes} />
    {:else if $layoutTemplate === "vertical-2"}
      <VerticalPartition2 {panes} />
    {:else if $layoutTemplate === "vertical-horizontal"}
      <VerticalHorizontalPartition {panes} />
    {:else}
      <HorizontalPartition {panes} />
    {/if}
  {/if}
</div>
