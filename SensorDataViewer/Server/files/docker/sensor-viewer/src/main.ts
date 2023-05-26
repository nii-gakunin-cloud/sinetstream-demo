import 'beercss';
import App from './App.svelte';
import './lib/chart/setupChart';

const app = new App({
  target: document.getElementById('app'),
  hydrate: true,
});

export default app;
