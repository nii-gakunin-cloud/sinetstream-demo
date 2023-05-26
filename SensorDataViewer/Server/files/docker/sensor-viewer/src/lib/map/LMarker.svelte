<script lang="ts">
  import L, { Map as LMap } from "leaflet";
  import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
  import iconUrl from "leaflet/dist/images/marker-icon.png";
  import shadowUrl from "leaflet/dist/images/marker-shadow.png";
  import { getContext, onDestroy } from "svelte";

  const map = getContext<() => LMap>("map")();

  export let longitude;
  export let latitude;
  export let timestamp;

  const icon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
  });
  const marker = L.marker([latitude, longitude], { icon });
  marker.addTo(map);
  $: {
    marker.setLatLng([latitude, longitude]);
    marker.bindPopup(`
    <table>
      <tr>
        <th>timestamp</th>
        <td>${timestamp}</td>
      </tr>
      <tr>
        <th>latitude</th>
        <td>${latitude}</td>
      </tr>
      <tr>
        <th>longitude</th>
        <td>${longitude}</td>
      </tr>
    </table>`);
  }

  onDestroy(() => {
    marker.remove();
  });
</script>
