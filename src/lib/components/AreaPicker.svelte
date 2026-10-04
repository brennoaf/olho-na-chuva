<script lang="ts">
 import { app } from '$lib/app.svelte';
 import { AREAS } from '$lib/areas';
 import { LocationError, currentPosition } from '$lib/geo';
 import Icon from '$lib/Icon.svelte';
 import { km } from '$lib/rain';
 import PageIntro from './PageIntro.svelte';
 let { compact = false, onchoose = () => {} }: { compact?: boolean; onchoose?: () => void } = $props();
 let locating = $state(false);
 let query = $state('');
 let here = $state<{ lat: number; lon: number } | null>(null);
 const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
 const list = $derived((here ? AREAS.map(area => ({ area, km: km(here!, area) })).sort((a, b) => a.km - b.km) : AREAS.map(area => ({ area, km: null as number | null }))).filter(({area}) => normalize(area.name + ' ' + area.short).includes(normalize(query.trim()))));
 const groups = $derived(here ? [{ title: 'Mais perto de você', icon: 'pin' as const, items: list }] : [
  { title: 'Canais e rios', icon: 'wave' as const, items: list.filter(i => i.area.hazard === 'inundacao') },
  { title: 'Barreiras', icon: 'hill' as const, items: list.filter(i => i.area.hazard === 'deslizamento') }
 ]);
 async function locate() {
  locating = true;
  try { here = await currentPosition(); }
  catch(error) { app.notify(error instanceof LocationError ? error.message : 'Não foi possível achar sua localização. Escolha na lista.', 'erro'); }
  finally { locating = false; }
 }
 const distance = (value: number) => value < 1 ? Math.round(value * 1000) + ' m' : value.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' km';
</script>
<div class="picker">
 {#if !compact}
  <PageIntro context="Olinda, Pernambuco" title="Onde você mora?" description="Busque pelo nome ou use sua localização." />
 {/if}
 <div class="picker-actions">
  <div class="picker-search glass-surface">
   <Icon name="search" class="h-6 w-6" />
   <label class="sr-only" for="area-search">Buscar área</label>
   <input id="area-search" type="search" placeholder="Buscar bairro ou área" bind:value={query} autocomplete="off" />
   {#if query}<button type="button" aria-label="Limpar busca" onclick={() => query = ''}><Icon name="close" class="h-5 w-5" /></button>{/if}
  </div>
  <button class="picker-locate glass-surface press" onclick={locate} disabled={locating}><Icon name="gps" class="h-6 w-6" /><span>{locating ? 'Buscando localização…' : 'Usar minha localização'}</span><Icon name="next" class="h-5 w-5" /></button>
 </div>
 {#if query}<p class="picker-result" aria-live="polite">{list.length + (list.length === 1 ? ' área encontrada' : ' áreas encontradas')}</p>{/if}
 <div class="area-groups">
  {#each groups as group}
   {#if group.items.length}
    <section class="area-group"><h2><Icon name={group.icon} class="h-5 w-5" />{group.title}</h2><ul class="glass-surface">
     {#each group.items as { area, km: d }}
      <li><button onclick={() => { app.chooseArea(area.id); onchoose(); }} aria-current={app.areaId === area.id ? 'true' : undefined}><span><b>{area.name}</b><span>{area.short}{d !== null ? ' · a ' + distance(d) : ''}</span></span>{#if app.areaId === area.id}<span class="selected-area"><Icon name="check" class="h-4 w-4" />Atual</span>{:else}<Icon name="next" class="h-5 w-5" />{/if}</button></li>
     {/each}
    </ul></section>
   {/if}
  {/each}
 </div>
 {#if !list.length}<div class="empty-state"><h2>Não encontramos essa área</h2><p>Tente outro nome ou veja todas as áreas atendidas.</p><button class="button button-quiet" onclick={() => query = ''}>Ver todas as áreas</button></div>{/if}
 <p class="privacy-note"><Icon name="shield" class="h-5 w-5" />Sua escolha fica somente neste celular.</p>
 <a class="picker-emergency" href="tel:08000810060"><Icon name="phone" class="h-5 w-5" /><span><b>Pedir ajuda</b><small>Defesa Civil: 0800 081 0060</small></span></a>
</div>
