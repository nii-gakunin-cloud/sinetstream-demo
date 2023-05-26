import sveltePreprocess from 'svelte-preprocess'
import dotenv from 'dotenv';
dotenv.config();

export default {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: sveltePreprocess({
    replace: [
      [/process\.env\.URL_API_WS/g, JSON.stringify(process.env.URL_API_WS)],
      [/process\.env\.URL_API/g, JSON.stringify(process.env.URL_API)],
    ],
  }),
  compilerOptions: {
    hydratable: true,
  }
}
