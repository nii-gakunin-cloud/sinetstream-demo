<script lang="ts">
  import { getContext } from "svelte";
  import { formKey, itemKey } from "./server";

  const { getParent } = getContext<Record<string, any>>(itemKey);
  const { updateTargets, targets } = getContext<Record<string, any>>(formKey);

  export let checkboxName: string = "targets";
  export let name: string;
  export let value: any = null;

  $: checkboxValue = `${getParent()}.${name}`;

  let prevTargets = $targets ?? [];
  const linkCheckbox = (parent: string, ...children: string[]) => {
    if (!prevTargets.includes(parent)) {
      const current = $targets ?? [];
      if (current.includes(parent)) {
        updateTargets(
          children
            .reduce((r, c) => (r.includes(c) ? r : [...r, c]), current)
            .sort()
        );
      }
    } else {
      const current = $targets ?? [];
      if (!current.includes(parent)) {
        updateTargets(current.filter((item) => !children.includes(item)));
      }
    }
  };

  $: {
    linkCheckbox(getParent(), checkboxValue);
    prevTargets = $targets ?? [];
  }
</script>

<div class="row">
  <div />
  <label class="checkbox">
    <input
      type="checkbox"
      name={checkboxName}
      value={checkboxValue}
      disabled={$targets.includes(getParent())}
      aria-label={checkboxValue}
    />
    <span />
  </label>
  <div>
    {#if value != null}
      <slot />: {JSON.stringify(value)}
    {:else}
      <slot />
    {/if}
  </div>
</div>
