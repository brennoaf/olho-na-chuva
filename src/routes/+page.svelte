<script lang="ts">
 import { app } from '$lib/app.svelte';
 import About from '$lib/components/About.svelte';
 import AreaPicker from '$lib/components/AreaPicker.svelte';
 import History from '$lib/components/History.svelte';
 import Home from '$lib/components/Home.svelte';
 import Prepare from '$lib/components/Prepare.svelte';
 import Toast from '$lib/components/Toast.svelte';
 import { onMount, tick } from 'svelte';
 onMount(() => {
  const cleanup = app.start();
  const focusPage = async () => {
   await tick();
   const kit = location.hash === '#/preparar?kit' ? document.getElementById('kit') : null;
   (kit ?? document.querySelector<HTMLElement>('h1'))?.focus({ preventScroll: true });
   kit?.scrollIntoView({ block: 'start' });
  };
  addEventListener('hashchange', focusPage);
  void focusPage();
  return () => { cleanup(); removeEventListener('hashchange', focusPage); };
 });
</script>
<svelte:head><title>{app.route === 'preparar' ? 'Se preparar' : app.route === 'historico' ? 'Registros da área' : app.route === 'sobre' ? 'Sobre' : app.route === 'lugar' || !app.area ? 'Escolha sua área' : app.area.name} · Olho na Chuva</title></svelte:head>
{#if app.route === 'lugar' || !app.area}<AreaPicker />
{:else if app.route === 'preparar'}<Prepare />
{:else if app.route === 'historico'}<History />
{:else if app.route === 'sobre'}<About />
{:else}<Home />{/if}
<Toast />
