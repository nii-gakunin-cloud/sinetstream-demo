<script lang="ts">
  import { reporter, ValidationMessage } from "@felte/reporter-svelte";
  import { validator } from "@felte/validator-zod";
  import { getContextClient, gql, queryStore } from "@urql/svelte";
  import { createForm } from "felte";
  import { onMount, setContext } from "svelte";
  import { navigate } from "svelte-routing";
  import { writable } from "svelte/store";
  import * as zod from "zod";
  import { settingsIndex, type ViewerSettingV1 } from "../../settings";
  import ConfigNameSelect from "./ConfigNameSelect.svelte";
  import { formKey, pickupParameter, settingParameters } from "./server";
  import ServerItemFieldset, { initTargets } from "./ServerItemFieldset.svelte";

  const targets = writable([] as string[]);
  setContext(formKey, {
    updateTargets: (targets: string[]) => {
      setFields("targets", targets);
    },
    targets,
  });
  const client = getContextClient();

  $: configId = -1;
  $: queryConfig = queryStore({
    client,
    query: gql`
      query ($id: Int!) {
        viewer_config_by_pk(id: $id) {
          name
          comment
          config
        }
      }
    `,
    variables: { id: configId },
  });

  function handleNameSelect(ev: CustomEvent) {
    const { id } = ev.detail;
    if (id >= 0) {
      setFields("name", id.toString());
    }
  }

  $: {
    if (!("targets" in $data)) {
      setFields("targets", initTargets);
    }
    const { name: idText } = $data;
    if (!$touched.name && configId >= 0) {
      setFields("name", configId.toString());
    } else if ((idText as string)?.length > 0) {
      configId = Number(idText);
    }
  }

  onMount(() => {
    settingParameters.set({});
  });

  const onSubmit = (values: Record<string, any>) => {
    const { config } = $queryConfig.data.viewer_config_by_pk ?? {};
    settingParameters.set(pickupParameter(config, values.targets));
    navigate(`/setting/${$settingsIndex}`);
  };

  function onCancel(_event: unknown) {
    settingParameters.set({});
    navigate(`/setting/${$settingsIndex}`);
  }

  const schema = zod.object({
    name: zod.string().min(1),
    targets: zod.array(zod.string()).min(1),
  });
  const { form, data, setFields, isValid, touched } = createForm({
    onSubmit,
    initialValues: {
      name: "",
      targets: initTargets,
    },
    extend: [validator({ schema }), reporter],
  });

  let setting: ViewerSettingV1 | null = null;
  $: {
    setting = $queryConfig?.data?.viewer_config_by_pk?.config ?? {};
    targets.set(($data?.targets as string[]) ?? []);
  }
</script>

<div>
  <form use:form>
    <ValidationMessage for="name">
      <div class="field suffix">
        <ConfigNameSelect
          name={"name"}
          selected={configId}
          on:match={handleNameSelect}
        />
        <i>arrow_drop_down</i>
        {#if $queryConfig?.data}
          {@const { comment } = $queryConfig.data?.viewer_config_by_pk ?? {}}
          <span class="helper">{comment ?? ""}</span>
        {/if}
      </div>
    </ValidationMessage>

    <article class="setting-fieldset scroll">
      <ServerItemFieldset {setting} />
    </article>

    <nav>
      <button type="submit" disabled={!$isValid}>Apply</button>
      <button type="button" on:click={onCancel}>Cancel</button>
    </nav>
  </form>
</div>

<style>
  .setting-fieldset {
    height: calc(100vh - 14.5rem);
  }
</style>
