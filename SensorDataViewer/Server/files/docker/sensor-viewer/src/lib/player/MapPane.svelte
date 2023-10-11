<script lang="ts">
  import { getContextClient, gql, queryStore } from "@urql/svelte";
  import { format, formatISO, fromUnixTime } from "date-fns";
  import { utcToZonedTime } from "date-fns-tz";
  import LMarker from "../map/LMarker.svelte";
  import BaseMapPane from "../pane/BaseMapPane.svelte";
  import { publisher } from "../settings";
  import { toResolution } from "../viewer/timeRange";
  import { current as currentTime, fromTime, toTime } from "./player";

  $: from = fromUnixTime($fromTime);
  $: to = fromUnixTime($toTime);
  $: current = fromUnixTime($currentTime);
  $: tablename = `location${toResolution({ from, to })}`;

  $: queryResult = queryStore({
    client: getContextClient(),
    query: gql`
      query($publisher: String, $from: timestamptz, $current: timestamptz) {
        point: ${tablename}(
          where: { publisher: { _eq: $publisher }, timestamp: {_gte: $from, _lte: $current}, latitude: {_is_null: false}, longitude: {_is_null: false} }
          order_by: { timestamp: desc }
          limit: 1
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
      current: formatISO(current),
    },
  });

  export let height: number;
  export let width: number;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  let basemap: any;
  let point: Record<string, any> | null;
  $: if ($queryResult.data && $queryResult.data["point"].length > 0) {
    point = $queryResult.data["point"][0];
    if (point) {
      basemap?.panInside(point.latitude, point.longitude);
    }
  }
</script>

<BaseMapPane {from} {to} {tablename} {height} {width} bind:this={basemap}>
  {#if point}
    <LMarker
      latitude={point.latitude}
      longitude={point.longitude}
      timestamp={format(
        utcToZonedTime(point.timestamp, tz),
        "yyyy-MM-dd HH:mm:ssXXX"
      )}
    />
  {/if}
</BaseMapPane>
