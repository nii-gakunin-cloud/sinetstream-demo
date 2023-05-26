<script lang="ts" context="module">
  export const layerList = [
    {
      url: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
      options: {
        attribution:
          '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>',
      },
      name: "電子国土基本図",
      visible: true,
    },
    {
      url: "https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png",
      options: {
        attribution:
          '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>',
      },
      name: "色別標高図",
    },
    {
      url: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
      options: {
        attribution:
          '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>',
      },
      name: "全国最新写真",
    },
  ];
</script>

<script lang="ts">
  import type { TileLayerOptions } from "leaflet";
  import L, { Control, Map as LMap, TileLayer } from "leaflet";
  import { getContext, onDestroy } from "svelte";

  const map = getContext<() => LMap>("map")();
  const layers = getContext<() => Control.Layers>("layers")();

  export let url: string;
  export let options: TileLayerOptions;
  export let visible: boolean = false;
  export let name: string;

  const layer: TileLayer = L.tileLayer(url, options);
  layers.addBaseLayer(layer, name);
  if (visible) {
    map.addLayer(layer);
  }

  onDestroy(() => {
    layers.removeLayer(layer);
  });
</script>
