<script lang="ts">
  import {
    cacheExchange,
    fetchExchange,
    initContextClient,
    subscriptionExchange,
  } from "@urql/svelte";
  import { createClient as createWSClient } from "graphql-ws";
  import { Route, Router } from "svelte-routing";
  import Home from "./routes/Home.svelte";
  import Player from "./routes/Player.svelte";
  import Setting from "./routes/Setting.svelte";
  import SettingDownload from "./routes/SettingDownload.svelte";
  import SettingUpload from "./routes/SettingUpload.svelte";
  import Viewer from "./routes/Viewer.svelte";

  const loc = window.location;
  const protocol = loc.protocol == "https:" ? "wss:" : "ws:";

  const apiUrl =
    process.env.URL_API ?? `${loc.protocol}//${loc.host}/v1/graphql`;
  const wsUrl = process.env.URL_API_WS ?? `${protocol}//${loc.host}/v1/graphql`;

  const wsClient = createWSClient({ url: wsUrl });
  initContextClient({
    url: apiUrl,
    exchanges: [
      cacheExchange,
      fetchExchange,
      subscriptionExchange({
        forwardSubscription: (request) => ({
          subscribe: (sink) => ({
            unsubscribe: wsClient.subscribe(
              { ...request, query: request.query! },
              sink
            ),
          }),
        }),
      }),
    ],
  });

  export let url = "";
</script>

<Router {url}>
  <div>
    <Route path="/viewer/:id" let:params>
      <Viewer id={parseInt(params.id)} />
    </Route>
    <Route path="/player/:id" let:params>
      <Player id={parseInt(params.id)} />
    </Route>
    <Route path="/setting/:id" let:params>
      <Setting id={parseInt(params.id)} />
    </Route>
    <Route path="/setting-upload/:id" let:params>
      <SettingUpload id={parseInt(params.id)} />
    </Route>
    <Route path="/setting-download/:id" let:params>
      <SettingDownload id={parseInt(params.id)} />
    </Route>
    <Route path="/"><Home /></Route>
  </div>
</Router>
