<script lang="ts">
  import L, { Control, LatLng, Map as LMap, type MapOptions } from "leaflet";
  import "leaflet/dist/leaflet.css";
  import { setContext } from "svelte";

  let map: LMap | undefined;
  let layers: Control.Layers | undefined;
  setContext("map", () => map);
  setContext("layers", () => layers);

  export let center: LatLng = new LatLng(35.65, 139.8);
  export let zoom: number = 12;
  export let options: MapOptions = { minZoom: 6 };
  export let height: number;
  export let width: number;

  const controlOptions = {
    hideSingleBase: true,
  };

  $: {
    height = height;
    width = width;
    if (map) {
      map.invalidateSize();
    }
  }

  function mapAction(container: HTMLElement) {
    map = L.map(container, {
      center,
      zoom,
      ...options,
    });
    layers = L.control.layers(undefined, undefined, controlOptions).addTo(map);

    return {
      destroy: () => {
        layers?.remove();
        map?.remove();
      },
    };
  }

  export const panInside = (point: LatLng) => {
    map?.panInside(point, { padding: [48, 48] });
  };
</script>

<div use:mapAction style:height style:width>
  {#if map}
    <slot />
  {/if}
</div>

<style global>
  .leaflet-control-container {
    height: 100%;
    font-size: 12px;
  }
</style>
