<script lang="ts">
  import {
    getContextClient,
    gql,
    queryStore,
    subscriptionStore,
  } from "@urql/svelte";
  import { format, formatISO, parseISO } from "date-fns";
  import Viewer from "viewerjs";
  import "viewerjs/dist/viewer.css";
  import { imageTopic, imageUpdateMethod, mode } from "../settings";
  import { refreshInterval } from "../viewer/timeRange";

  let image: HTMLElement;
  let viewer: Viewer | undefined;
  $: if (image) {
    viewer = new Viewer(image, {
      button: false,
      navbar: false,
      toolbar: false,
      viewed() {
        viewer?.zoomTo(1);
      },
    });
  }

  export let from: Date;
  export let to: Date;
  export let responsive = false;

  let queryMode =
    $mode === "player" ||
    $imageUpdateMethod === "polling" ||
    $refreshInterval.interval === 0
      ? "query"
      : "subscription";

  $: queryResult =
    queryMode === "query"
      ? queryStore({
          client: getContextClient(),
          query: gql`
            query ($topic: String, $from: timestamptz, $to: timestamptz) {
              picamera(
                limit: 1
                order_by: { timestamp: desc }
                where: {
                  topic: { _eq: $topic }
                  timestamp: { _gte: $from, _lte: $to }
                }
              ) {
                timestamp
                path
              }
            }
          `,
          variables: {
            topic: $imageTopic,
            from: formatISO(from),
            to: formatISO(to),
          },
        })
      : subscriptionStore({
          client: getContextClient(),
          query: gql`
            subscription ($topic: String) {
              picamera(
                limit: 1
                order_by: { timestamp: desc }
                where: { topic: { _eq: $topic } }
              ) {
                timestamp
                path
              }
            }
          `,
          variables: {
            topic: $imageTopic,
          },
        });

  let timestamp: string;
  let path: string;
  let srcset: string | null = "";
  let sizes: string | null = "";
  $: if ($queryResult.data && $queryResult.data.picamera.length > 0) {
    timestamp = format(
      parseISO($queryResult.data.picamera[0].timestamp),
      "yyyy/MM/dd HH:mm:ss XXX"
    );
    path = "/" + $queryResult.data.picamera[0].path;

    let paths = $queryResult.data.picamera[0].path.split("/");
    if (responsive) {
      srcset = [320, 640, 1280]
        .map((x) => {
          const filename = paths.at(-1).replace(".jpg", ".webp");
          const rest = paths.slice(2, -1);
          return `/${paths[0]}/resize-${x}/${rest.join("/")}/${filename} ${x}w`;
        })
        .join(", ");
      sizes = "(max-width: 480px) 320px, (max-width: 960px) 640px, 1280px";
    }
  }

  function showViewer() {
    if (responsive) {
      srcset = null;
      sizes = null;
    }
    viewer?.show();
  }
</script>

{#if path != null}
  <figure>
    <figcaption class="center-align">
      {timestamp != null ? timestamp : ""}
    </figcaption>
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions a11y-click-events-have-key-events -->
    <img
      src={path}
      {srcset}
      {sizes}
      alt="Photos taken with picamera"
      on:click={showViewer}
      bind:this={image}
    />
  </figure>
{:else}
  <div class="fill middle-align center-align" style:height="100%">
    <div class="center-align">
      <i class="extra">image</i>
    </div>
  </div>
{/if}

<style>
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  figure {
    width: 100%;
    height: calc(100% - 1.5em);
    object-fit: contain;
    margin: 0;
  }
  figcaption {
    font-size: larger;
  }
</style>
