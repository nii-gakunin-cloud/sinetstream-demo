<script lang="ts">
  import {
    getContextClient,
    gql,
    mutationStore,
    queryStore,
  } from "@urql/svelte";
  import { createEventDispatcher } from "svelte";
  import type { ViewerSettingV1 } from "../../settings";
  import { currentSetting } from "../../settings";
  import { pickupParameter } from "./server";

  export let name: string | null;
  export let comment: string | null = "";
  export let targets: string[] = [];

  const client = getContextClient();
  $: queryConfig = queryStore({
    client,
    query: gql`
      query ($name: String!) {
        viewer_config(where: { name: { _eq: $name } }) {
          id
          comment
          config
        }
      }
    `,
    variables: { name: name ?? "" },
  });

  let mutationResult = undefined;
  const insertConfig = () => {
    if ($mutationResult != null) {
      return;
    }
    const config = pickupParameter($currentSetting, targets);
    mutationResult = mutationStore({
      client,
      query: gql`
        mutation ($config: jsonb, $name: String, $comment: String) {
          insert_viewer_config(
            objects: { config: $config, name: $name, comment: $comment }
          ) {
            returning {
              id
              name
              config
              comment
            }
          }
        }
      `,
      variables: { name, config, comment },
    });
  };
  const updateConfig = (id: number, cfg: ViewerSettingV1, cmt: string) => {
    if ($mutationResult != null) {
      return;
    }
    const newComment = comment?.length > 0 ? comment : cmt;
    const config = pickupParameter($currentSetting, targets, cfg);
    mutationResult = mutationStore({
      client,
      query: gql`
        mutation ($id: Int!, $config: jsonb, $comment: String) {
          update_viewer_config_by_pk(
            pk_columns: { id: $id }
            _set: { config: $config, comment: $comment }
          ) {
            id
            name
            config
            comment
          }
        }
      `,
      variables: { id, config, comment: newComment },
    });
  };

  let dialog = false;
  let force = false;
  $: if (name != null && $queryConfig?.data) {
    const q = $queryConfig?.data?.viewer_config;
    if (q.length > 0) {
      if (force) {
        dialog = false;
        const { id, config, comment } = q[0];
        updateConfig(id, config, comment);
      } else {
        dialog = true;
      }
    } else {
      insertConfig();
    }
  }

  const dispatch = createEventDispatcher();
  $: if ($queryConfig?.error != null) {
    dispatch("notify", { error: $queryConfig.error });
  }
  $: if ($mutationResult?.error != null) {
    dispatch("notify", { error: $mutationResult.error });
  } else if ($mutationResult?.data != null) {
    dispatch("notify", { mutation: $mutationResult.data });
  }

  function onCancel() {
    dialog = false;
    dispatch("cancel");
  }

  function forceUpdate() {
    force = true;
  }
</script>

{#if dialog}
  <div class="overlay active" />
  <div class="modal active">
    <h6>Warning</h6>
    <div>
      <i>warning</i>
      <span>
        サーバに登録されている設定を上書き更新しようとしています。
        よろしいですか？
      </span>
    </div>
    <nav class="right-align">
      <button class="border" on:click={onCancel}>Cancel</button>
      <button on:click={forceUpdate}>OK</button>
    </nav>
  </div>
{/if}
