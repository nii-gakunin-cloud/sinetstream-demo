<script lang="ts">
  import { reporter, ValidationMessage } from "@felte/reporter-svelte";
  import { validator } from "@felte/validator-zod";
  import { createForm, getValue } from "felte";
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import * as zod from "zod";
  import {
    currentSetting,
    mode,
    settings,
    settingsIndex,
    viewerSettingSchemaV1,
  } from "../settings";
  import AndroidSensorsForm from "./AndroidSensorsForm.svelte";
  import ChartForm from "./ChartForm.svelte";
  import LayoutForm from "./LayoutForm.svelte";
  import PerftoolForm from "./PerftoolForm.svelte";
  import PicameraForm from "./PicameraForm.svelte";
  import PlayerForm, { validate as playerValidate } from "./PlayerForm.svelte";
  import { settingParameters } from "./server/server";

  export let prevIndex;

  const schema = viewerSettingSchemaV1
    .omit({ name: true, version: true })
    .extend({
      name: zod.string().min(1),
    });

  const onSubmit = (values) => {
    let setting = {
      version: "1.0",
      ...values,
    };
    if ($settingsIndex < $settings.length && $settingsIndex >= 0) {
      $settings[$settingsIndex] = setting;
    } else {
      $settings.push(setting);
    }
    $settings = $settings;
    navigate(`/${$mode}/${$settingsIndex}`);
  };

  const validateName = (values) => {
    const errors = {};
    const unique = $settings
      .filter((_, idx) => idx !== Number($settingsIndex))
      .every((it) => it.name !== values.name);
    if (!unique) {
      errors["name"] = "The name must be unique.";
    }
    const playerErrors = playerValidate(values.player);
    return { ...errors, ...playerErrors };
  };

  const {
    form,
    data,
    setFields,
    isValid,
    isDirty,
    reset,
    validate,
    setIsDirty,
  } = createForm({
    onSubmit,
    initialValues: $currentSetting,
    validate: validateName,
    extend: [validator({ schema }), reporter],
  });

  const applyDownloadSetting = () => {
    Object.keys($settingParameters).forEach((key0) => {
      Object.keys($settingParameters[key0]).forEach((key1) => {
        const path = `${key0}.${key1}`;
        const oldValue = getValue($data, path);
        const newValue = $settingParameters[key0][key1];
        if (oldValue !== newValue) {
          setFields(path, newValue, true);
          setIsDirty(true);
        }
      });
    });
    settingParameters.set({});
  };

  onMount(() => {
    applyDownloadSetting();
    validate();
  });

  function onCancel(_event) {
    if ($settingsIndex < $settings.length) {
      navigate(`/${$mode}/${$settingsIndex}`);
    } else {
      navigate(`/${$mode}/${prevIndex}`);
    }
  }
  function onReset(_event) {
    reset();
    validate();
  }

  function onDelete(_event) {
    $settings.splice($settingsIndex, 1);
    $settings = $settings;
    navigate(`/${$mode}/${$settingsIndex > 0 ? $settingsIndex - 1 : 0}`);
  }
</script>

<div>
  <form use:form>
    <ValidationMessage for="name" let:messages={message}>
      <div class="field label" class:invalid={message != null}>
        <input type="text" name="name" id="setting-name" />
        <label for="setting-name">name</label>
        <span class="error">{message || ""}</span>
      </div>
    </ValidationMessage>

    <div class="scroll settings-form">
      <PlayerForm />
      <AndroidSensorsForm
        {setFields}
        updateDirty={() => {
          $isDirty = true;
        }}
        selected={$data.android.sensors}
      />
      <PicameraForm />
      <PerftoolForm />
      <LayoutForm />
      <ChartForm />
    </div>

    <nav>
      <button type="submit" disabled={!($isDirty && $isValid)}>Save</button>
      <button type="button" disabled={!$isDirty} on:click={onReset}
        >Reset</button
      >
      <button type="button" on:click={onCancel} disabled={$settings.length < 1}
        >Cancel</button
      >
      <div class="max" />
      {#if $settings.length > 1 && $settingsIndex < $settings.length}
        <button type="button" class="error" on:click={onDelete}>Delete</button>
      {/if}
    </nav>
  </form>
</div>

<style>
  .field.label > label {
    color: silver;
  }

  .settings-form {
    height: calc(100vh - 15rem);
  }
</style>
