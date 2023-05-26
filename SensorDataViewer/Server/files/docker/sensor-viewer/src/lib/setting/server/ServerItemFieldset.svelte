<script lang="ts" context="module">
  export const initTargets = [
    "player.from",
    "android",
    "android.publisher",
    "image",
    "image.topic",
    "perftool",
    "perftool.name",
  ];
</script>

<script lang="ts">
  import type { ViewerSettingV1 } from "src/lib/settings";
  import HorizontalLayoutIcon from "../layout/HorizontalLayoutIcon.svelte";
  import Vertical2LayoutIcon from "../layout/Vertical2LayoutIcon.svelte";
  import VerticalHorizontalLayoutIcon from "../layout/VerticalHorizontalLayoutIcon.svelte";
  import VerticalLayoutIcon from "../layout/VerticalLayoutIcon.svelte";
  import ItemCheckbox from "./ItemCheckbox.svelte";
  import SubItemCheckbox from "./SubItemCheckbox.svelte";
  import SubItemLabel from "./SubItemLabel.svelte";

  export let initValues: string[] = initTargets;
  export let setting: ViewerSettingV1 | null;
</script>

<fieldset aria-label="target list of settings">
  {#if setting}
    {@const {
      from: playerFrom,
      to: playerTo,
      ...playerParams
    } = setting?.player ?? {}}
    {@const { publisher, ...androidParams } = setting?.android ?? {}}
    {@const { topic, ...imageParams } = setting?.image ?? {}}
    {@const { name: perftoolName, ...perftoolParams } = setting?.perftool ?? {}}
    {@const { layout, chart: chartParams } = setting ?? {}}

    <ItemCheckbox value={"player"}>
      <span slot="label">Playback</span>
      <SubItemCheckbox name={"from"}>
        From / To:
        {JSON.stringify(playerFrom) ?? ""} ---
        {JSON.stringify(playerTo) ?? ""}
      </SubItemCheckbox>

      <SubItemLabel value={playerParams?.tick}>Refresh Interval</SubItemLabel>
      <SubItemLabel value={playerParams?.speed}>Resolution</SubItemLabel>
      <SubItemLabel value={playerParams?.repeat}>Repeat</SubItemLabel>
    </ItemCheckbox>

    <ItemCheckbox value={"android"}>
      <span slot="label">Android Sensors</span>
      <SubItemCheckbox value={publisher} name={"publisher"}>
        Publisher
      </SubItemCheckbox>
      <SubItemLabel value={androidParams?.map}>Map</SubItemLabel>
      <SubItemLabel value={androidParams?.lte}>LTE Chart</SubItemLabel>
      <SubItemLabel value={androidParams?.sensors}>Sensors</SubItemLabel>
    </ItemCheckbox>

    <ItemCheckbox value={"image"}>
      <span slot="label">Raspberry Pi Camera</span>
      <SubItemCheckbox value={topic} name={"topic"}>Topic Name</SubItemCheckbox>
      <SubItemLabel value={imageParams?.visible}>Visible</SubItemLabel>
      <SubItemLabel value={imageParams?.update}>Update Method</SubItemLabel>
    </ItemCheckbox>

    <ItemCheckbox value={"perftool"}>
      <span slot="label">Perftool</span>
      <SubItemCheckbox value={perftoolName} name={"name"}>
        Perftool Name
      </SubItemCheckbox>
      <SubItemLabel value={perftoolParams?.visible}>Visible</SubItemLabel>
    </ItemCheckbox>

    <ItemCheckbox value={"layout"}>
      <span slot="label">Layout</span>
      <SubItemLabel>
        {#if layout?.template === "horizontal"}
          <HorizontalLayoutIcon />
        {:else if layout?.template === "vertical-horizontal"}
          <VerticalHorizontalLayoutIcon />
        {:else if layout?.template === "vertical"}
          <VerticalLayoutIcon />
        {:else if layout?.template === "vertical-2"}
          <Vertical2LayoutIcon />
        {/if}
      </SubItemLabel>
    </ItemCheckbox>

    <ItemCheckbox value={"chart"}>
      <span slot="label">Chart</span>
      <SubItemLabel value={chartParams?.line?.enabled}>
        Line Visible
      </SubItemLabel>
      <SubItemLabel value={chartParams?.line?.size}>Line Width</SubItemLabel>
      <SubItemLabel value={chartParams?.point?.enabled}>
        Point Visible
      </SubItemLabel>
      <SubItemLabel value={chartParams?.point?.size}>Point Size</SubItemLabel>
      <SubItemLabel value={chartParams?.minSize?.width}>
        Minimum Width
      </SubItemLabel>
      <SubItemLabel value={chartParams?.minSize?.height}>
        Minimum Height
      </SubItemLabel>
    </ItemCheckbox>
  {:else}
    {#each initValues as value}
      <input type="checkbox" name="targets" {value} />
    {/each}
  {/if}
</fieldset>

<style>
  fieldset {
    border-color: transparent;
  }
</style>
