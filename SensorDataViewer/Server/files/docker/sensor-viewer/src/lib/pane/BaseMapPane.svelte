<script lang="ts">
  import { getContextClient, gql, queryStore } from "@urql/svelte";
  import { format, formatISO } from "date-fns";
  import { toZonedTime } from "date-fns-tz";
  import { latLng } from "leaflet";
  import LGeoJson, { toGeoJson } from "../map/LGeoJson.svelte";
  import LMap from "../map/LMap.svelte";
  import LMarker from "../map/LMarker.svelte";
  import LTileLayer, { layerList } from "../map/LTileLayer.svelte";
  import { publisher } from "../settings";

  export let height: number;
  export let width: number;
  export let from: Date;
  export let to: Date;
  export let tablename: string;
  export let showMarker = false;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  $: queryResult = queryStore({
    client: getContextClient(),
    query: gql`
      query($publisher: String, $from: timestamptz, $to: timestamptz) {
        ${tablename}(
          where: { publisher: { _eq: $publisher }, timestamp: {_gte: $from, _lte: $to}, latitude: {_is_null: false}, longitude: {_is_null: false} }
          order_by: { timestamp: asc }
        ) {
          timestamp
          longitude
          latitude
        }
      }
    `,
    variables: {
      publisher: $publisher,
      from: formatISO(from),
      to: formatISO(to),
    },
  });

  let map: any;
  export const panInside = (latitude: number, longitude: number) => {
    if (map != null) {
      const point = latLng(latitude, longitude);
      map.panInside(point);
    }
  };

  let data: Record<string, any>[] = [];
  let point: Record<string, any> | null;
  $: if ($queryResult.data) {
    data = $queryResult.data[tablename];
    if (showMarker && data.length > 0) {
      point = data[data.length - 1];
      panInside(point.latitude, point.longitude);
    }
  }
</script>

<LMap {height} {width} bind:this={map}>
  {#each layerList as layer}
    <LTileLayer {...layer} />
  {/each}
  {#if data.length > 0}
    <LGeoJson geoJson={toGeoJson(data)} />
  {/if}
  {#if showMarker && point}
    <LMarker
      latitude={point.latitude}
      longitude={point.longitude}
      timestamp={format(
        toZonedTime(point.timestamp, tz),
        "yyyy-MM-dd HH:mm:ssXXX"
      )}
    />
  {/if}
  <slot />
</LMap>
