<script lang="ts">
  import { getContextClient, gql, queryStore } from "@urql/svelte";
  import { createEventDispatcher } from "svelte";

  export let name = "name";
  export let value = "";
  export let error: string[] | null = null;

  const client = getContextClient();
  const queryNames = queryStore({
    client,
    query: gql`
      query {
        viewer_config {
          name
        }
      }
    `,
  });
  const dispatch = createEventDispatcher();
  $: if ($queryNames?.error != null) {
    dispatch("notify", { error: $queryNames.error });
  } else if ($queryNames?.data != null) {
    dispatch("notify", { data: $queryNames.data.viewer_config });
  }
</script>

<div class="field label" class:invalid={error != null}>
  <input
    type="text"
    {name}
    id="setting-name"
    disabled={$queryNames?.error != null}
  />
  <label for="setting-name">name</label>
  {#if error}
    <span class="error">{error}</span>
  {:else if $queryNames?.data}
    {@const names = $queryNames.data.viewer_config.map((x) => x.name) ?? []}
    <span class="helper">
      {#if names.includes(value)}
        登録済みの名前。登録済みの設定内容が更新されます。
      {:else}
        未登録の名前。新たな設定として登録されます。
      {/if}
    </span>
  {/if}
</div>
