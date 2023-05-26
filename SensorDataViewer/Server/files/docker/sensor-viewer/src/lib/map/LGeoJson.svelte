<script lang="ts" context="module">
  export function toGeoJson(items) {
    return {
      type: "Feature",
      properties: {
        times: items.map((it) => it.timestamp),
      },
      geometry: {
        type: "LineString",
        coordinates: items.map((it) => [it.longitude, it.latitude]),
      },
    };
  }
</script>

<script lang="ts">
  import L, { Control, Map as LMap } from "leaflet";
  import { getContext, onDestroy } from "svelte";

  const map = getContext<() => LMap>("map")();
  const layers = getContext<() => Control.Layers>("layers")();

  export let geoJson: any;

  const layer = L.geoJSON(null, {
    style: {
      color: "red",
    }
  });
  layer.addTo(map);
  layers.addOverlay(layer, "GeoJSON");
  $: {
    layer.clearLayers();
    layer.addData(geoJson);
  }

  onDestroy(() => {
    layers.removeLayer(layer);
    layer.remove();
  });
</script>
