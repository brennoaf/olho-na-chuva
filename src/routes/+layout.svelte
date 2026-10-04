<script lang="ts">
 import '../app.css';
 import { app } from '$lib/app.svelte';
 import Icon from '$lib/Icon.svelte';
 import ChevronDown from '@lucide/svelte/icons/chevron-down';
 import AreaPicker from '$lib/components/AreaPicker.svelte';
 import Back from '$lib/components/Back.svelte';
 import { onMount, tick } from 'svelte';
 let { children } = $props();
 let large = $state(false);
 let areaDialog: HTMLDialogElement;
 let selectingArea = $state(false);
 async function openAreas() {
  selectingArea = true;
  await tick();
  areaDialog.showModal();
  areaDialog.querySelector<HTMLElement>('#area-dialog-title')?.focus();
 }
 const links = [
  { href: '#/', route: 'inicio', label: 'Agora', icon: 'weather' },
  { href: '#/preparar', route: 'preparar', label: 'Se preparar', icon: 'backpack' },
  { href: '#/historico', route: 'historico', label: 'Registros', icon: 'note' },
  { href: '#/sobre', route: 'sobre', label: 'Sobre', icon: 'info' }
 ] as const;
 onMount(() => { try { large = localStorage.getItem('olho-na-chuva:letra') === 'grande'; } catch { /* Optional storage. */ } });
 $effect(() => { document.documentElement.dataset.text = large ? 'large' : 'normal'; });
 function resizeText() {
  large = !large;
  try { localStorage.setItem('olho-na-chuva:letra', large ? 'grande' : 'normal'); } catch { /* Optional storage. */ }
 }
</script>
<div class="app-shell" data-sky={app.sky} data-level={app.shellLevel ?? undefined}>
<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
<header class="site-header">
 <div class="header-inner">
  {#if app.route === 'inicio' && app.area}
   <button class="location-control" onclick={openAreas} aria-haspopup="dialog" aria-label={`Mudar área. Área atual: ${app.area.name}`}>
    <Icon name="pin" class="h-6 w-6" />
   <span><span class="location-caption">Mudar área</span><strong>{app.area.name}<ChevronDown size={20} aria-hidden="true" /></strong></span>
   </button>
  {:else if app.route !== 'lugar' || app.area}
  <Back />
  {:else}
  <a class="brand" href="#/" aria-label="Olho na Chuva, início">
   <span class="brand-mark"><Icon name="rain" class="h-7 w-7" /></span>
   <span>olho na chuva</span>
  </a>
  {/if}
  <button class="text-size" onclick={resizeText} aria-pressed={large} aria-label="Letras maiores"><span aria-hidden="true">A<span class="text-size-big">a</span></span><span class="text-size-label">Letras maiores</span></button>
 </div>
</header>
<dialog bind:this={areaDialog} class="area-sheet" aria-labelledby="area-dialog-title" onclose={() => selectingArea = false}>
 {#if selectingArea}
  <div class="sheet-heading"><h2 id="area-dialog-title" tabindex="-1">Mudar área</h2><button onclick={() => areaDialog.close()} aria-label="Fechar escolha de área"><Icon name="close" class="h-6 w-6" /></button></div>
  <AreaPicker compact onchoose={() => areaDialog.close()} />
 {/if}
</dialog>
<main id="conteudo" tabindex="-1">
 {@render children()}
</main>
<footer class="site-footer"><span>Dados públicos · Sem cadastro</span></footer>
{#if app.area}
 <nav class="mobile-nav" aria-label="Navegação principal">
  {#each links as link}<a href={link.href} aria-current={app.route === link.route ? 'page' : undefined}><Icon name={link.icon} class="h-6 w-6" /><span>{link.label}</span></a>{/each}
 </nav>
{/if}
</div>
