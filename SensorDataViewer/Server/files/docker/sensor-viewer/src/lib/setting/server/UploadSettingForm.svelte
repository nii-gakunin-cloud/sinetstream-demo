<script lang="ts">
  import { reporter, ValidationMessage } from "@felte/reporter-svelte";
  import { validator } from "@felte/validator-zod";
  import { createForm } from "felte";
  import { setContext } from "svelte";
  import { navigate } from "svelte-routing";
  import { writable } from "svelte/store";
  import * as zod from "zod";
  import { currentSetting, settingsIndex } from "../../settings";
  import ErrorToast from "./ErrorToast.svelte";
  import MutationSetting from "./MutationSetting.svelte";
  import { formKey } from "./server";
  import ServerItemFieldset, { initTargets } from "./ServerItemFieldset.svelte";
  import UploadNameInput from "./UploadNameInput.svelte";

  const targets = writable([] as string[]);
  setContext(formKey, {
    targets,
    updateTargets: (targets: string[]) => {
      setFields("targets", targets);
    },
  });

  let configName: string | null = null;
  const onSubmit = (_values: unknown) => {
    let { name } = $data;
    configName = name as string;
  };

  const schema = zod.object({
    name: zod.string().min(1),
    comment: zod.string(),
    targets: zod.array(zod.string()).min(1),
  });

  const { form, data, setFields, isValid } = createForm({
    onSubmit,
    initialValues: {
      name: $currentSetting?.name,
      targets: initTargets,
    },
    extend: [validator({ schema }), reporter],
  });

  function back() {
    navigate(`/setting/${$settingsIndex}`);
  }

  function onCancel(_event: unknown) {
    back();
  }

  let gqlError: string | null = null;

  function handleNotify(event: CustomEvent) {
    const { error, mutation } = event?.detail ?? {};
    gqlError = error != null ? error.message : null;
    if (mutation != null) {
      configName = null;
      back();
    }
  }

  function handleCancelUpdate() {
    configName = null;
  }

  $: {
    const new_targets = $data?.targets;
    if (new_targets != null && Array.isArray(new_targets)) {
      targets.set(new_targets);
    } else {
      targets.set([]);
    }
  }
</script>

<div class="scroll settings-form">
  <form use:form>
    <ValidationMessage for="name" let:messages>
      <UploadNameInput
        name={"name"}
        value={($data?.name ?? "").toString()}
        error={messages}
        on:notify={handleNotify}
      />
    </ValidationMessage>

    <ValidationMessage for="comment" let:messages={message}>
      <div class="field label" class:invalid={message != null}>
        <input type="text" name="comment" id="setting-comment" />
        <label for="setting-comment">comment</label>
        <span class="error">{message || ""}</span>
      </div>
    </ValidationMessage>

    <article class="setting-fieldset scroll">
      <ServerItemFieldset setting={$currentSetting} />
    </article>

    <nav>
      <button type="submit" disabled={!$isValid || gqlError != null}>
        Upload
      </button>
      <button type="button" on:click={onCancel}>Cancel</button>
    </nav>
  </form>
  <MutationSetting
    name={configName}
    comment={($data?.comment ?? "").toString()}
    targets={$targets}
    on:notify={handleNotify}
    on:cancel={handleCancelUpdate}
  />
  {#if gqlError != null}
    <ErrorToast message={gqlError} />
  {/if}
</div>

<style>
  .setting-fieldset {
    height: calc(100vh - 19.5rem);
  }
</style>
