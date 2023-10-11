<script lang="ts">
  import { getContextClient, gql, queryStore } from "@urql/svelte";
  import { createEventDispatcher } from "svelte";
  import { currentSetting } from "../../settings";
  import ErrorToast from "./ErrorToast.svelte";

  const client = getContextClient();
  const queryNames = queryStore({
    client,
    query: gql`
      query {
        viewer_config {
          id
          name
        }
      }
    `,
  });
  const dispatch = createEventDispatcher();

  export let name: string;
  export let selected = -1;
  let container: any;

  $: if (container && $queryNames?.data && selected < 0) {
    const rst = $queryNames.data.viewer_config.filter(
      (item: Record<string, any>) => item.name === $currentSetting.name
    );
    if (rst.length > 0) {
      dispatch("match", { id: rst[0].id });
    }
  }
</script>

<select {name} bind:this={container} aria-label="config-name-select">
  {#if selected < 0}
    <option value="" selected>--Please choose an option--</option>
  {/if}
  {#if $queryNames?.data}
    {#each $queryNames.data.viewer_config as item}
      <option value={item.id}>{item.name}</option>
    {/each}
  {/if}
</select>
{#if $queryNames?.error}
  <ErrorToast message={$queryNames.error.message} />
{/if}
