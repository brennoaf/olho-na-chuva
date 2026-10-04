<script lang="ts">
 import { app } from '$lib/app.svelte';
 import { worst } from '$lib/alerts';
 import { SHELTERS } from '$lib/areas';
 import Icon from '$lib/Icon.svelte';
 import { km } from '$lib/rain';
 import { canSpeak, speak, stopSpeaking } from '$lib/speech';
 import { formatAgo } from '$lib/time';
 import { advice, moments, neighborMessage, rows, spoken } from '$lib/words';
 import { onDestroy } from 'svelte';
 import Timeline from './Timeline.svelte';

 const area = $derived(app.area!);
 const a = $derived(app.assessment);
 const data = $derived(app.data);
 const station = $derived(app.station);
 const forecast = $derived(app.forecast);
 const risk = $derived(app.risk);
 const stale = $derived(app.stale);
 const incomplete = $derived(app.incomplete);
 const uncertain = $derived(app.uncertain);
 const message = $derived(advice(area.hazard,a ?? {risk:0,reasons:[],window:null,blind:true},{stale,incomplete},station?.station ?? null));
 const shelter = $derived(SHELTERS.map(s => ({ ...s, km: km(area, s) })).sort((p, q) => p.km - q.km)[0]!);
 const route = $derived('https://www.google.com/maps/dir/?api=1&destination=' + shelter.lat + ',' + shelter.lon + '&travelmode=walking');
 const day = $derived(data && a ? moments(area.hazard, station?.station ?? null, forecast, data.tides, a.window, app.now) : []);
 const table = $derived.by(() => {
  if (!data) return { list: [], source: '' };
  const result = rows(area, station, data.tides, forecast, worst(app.activeAlerts), app.now, t => formatAgo(t, app.now));
  const official = result.list.find(row => row.label === 'aviso oficial');
  if (official && official.value === 'nenhum' && app.failed.some(source => source.startsWith('avisos'))) {
   official.value = 'sem dado'; official.detail = 'consulta indisponível';
  }
  return result;
 });
 const summary = $derived(table.list.filter(r => ['chuva medida', area.hazard === 'inundacao' ? 'maré' : 'últimos 3 dias', 'previsão'].includes(r.label)));
 let speaking = $state(false);
 function listen() {
  if (!a || !data) return;
  if (speaking) { stopSpeaking(); speaking = false; return; }
  speaking = true;
  const text = spoken(area, a, station?.station ?? null, data.tides, forecast, app.now, {stale,incomplete});
  speak(text, () => speaking = false);
 }
 function shareWithPeople() {
  if (!a || !data) return;
  const message = neighborMessage(area, a, station?.station ?? null, data.tides, forecast, app.now, {
   fetchedAt: data.fetchedAt, stale, incomplete
  });
  open('https://wa.me/?text=' + encodeURIComponent(message.trim()), '_blank', 'noopener');
 }
 onDestroy(stopSpeaking);
</script>

<div class="home-view">
 <h1 class="sr-only" tabindex="-1">{area.name}</h1>
 {#if !a || !data}
  <section class="loading-panel" aria-live="polite">
   <Icon name="rain" class="h-10 w-10" />
   <h2>{app.loading ? 'Olhando a chuva por aqui…' : 'Ainda não temos dados'}</h2>
   <p>{app.loading ? 'Buscando a chuva medida, a previsão e os avisos.' : 'Conecte-se à internet e tente atualizar.'}</p>
   <button class="button button-primary" onclick={() => app.refresh(true)} disabled={app.loading}>Tentar atualizar</button>
   <a class="button button-quiet" href="tel:08000810060"><Icon name="phone" class="h-5 w-5" />Ligar para a Defesa Civil</a>
  </section>
 {:else}
  <section class="status-panel" data-level={uncertain ? 'unknown' : risk} aria-labelledby="level-title">
   <div class="status-content">
    {#if !uncertain && message.notice}<p class="data-notice">{message.notice}</p>{/if}
    <h2 id="level-title">{message.title}</h2>
    {#if risk > 0 && message.reason}<p class="status-reason">{message.reason}</p>{/if}
    <p class="status-instruction">{message.instruction}</p>
    <div class="status-actions">
     {#if risk === 2}<a class="button button-primary" href="#/preparar?kit"><Icon name="shield" class="h-5 w-5" />Ver o que separar</a>{/if}
     {#if canSpeak()}<button class="button button-listen" onclick={listen} aria-pressed={speaking}><Icon name={speaking ? 'stop' : 'volume'} class="h-5 w-5" />{speaking ? 'Parar leitura' : 'Ouvir aviso'}</button>{/if}
    </div>
   </div>
  </section>
  <div class="update-row" aria-live="polite">
   <span>{!app.online ? 'Sem internet · ' : ''}{stale ? 'Dados salvos ' : 'Consulta '}{formatAgo(data.fetchedAt, app.now)}</span>
   <button onclick={() => app.refresh(true)} disabled={app.loading}><Icon name="refresh" class="h-4 w-4" />{app.loading ? 'Atualizando' : 'Atualizar'}</button>
  </div>
  {#snippet actions()}
  <div class="quick-actions" class:secondary={risk !== 3}>
   <a href="tel:08000810060" aria-label="Ligar para a Defesa Civil"><Icon name="phone" class="h-6 w-6" /><span>Pedir ajuda</span></a>
   <button onclick={shareWithPeople} aria-label="Compartilhar aviso no WhatsApp"><Icon name="whatsapp" class="h-7 w-7" /><span>Compartilhar no WhatsApp</span></button>
  </div>
  {/snippet}
  {@render actions()}
  <details class="numbers forecast-details">
   <summary><span><Icon name="weather" class="h-6 w-6" />Ver previsão</span><Icon name="next" class="h-4 w-4" /></summary>
   <section class="weather-summary" aria-label="Resumo da chuva e da maré">
   {#each summary as row}
    <div><p><Icon name={row.label === 'maré' ? 'wave' : row.label === 'últimos 3 dias' ? 'hill' : 'rain'} class="h-5 w-5" />{row.label}</p><strong>{row.value}</strong><span>{row.detail}</span></div>
   {/each}
  </section>
    <section class="day-section" aria-labelledby="day-heading">
     <div class="section-heading"><h2 id="day-heading">Daqui a pouco, por aqui</h2><span>Próximas 12 horas</span></div>
     <ol class="day-list">
      {#each day as moment}
       <li class:important={moment.strong}><span class="moment-time">{moment.when}</span><span class="moment-icon"><Icon name={moment.icon} class="h-5 w-5" /></span><p>{moment.text}</p></li>
     {/each}
    </ol>
    </section>
  </details>
    <details class="numbers">
     <summary><span>Entender o aviso</span><Icon name="next" class="h-4 w-4" /></summary>
     <div class="numbers-content">
      <p class="explanation">{message.detail}</p>
      <p class="muted">Chuva medida no {table.source}.</p>
      <dl>{#each table.list as row}<div><dt><b>{row.label}</b><span>{row.detail}</span></dt><dd>{row.value}</dd></div>{/each}</dl>
      <Timeline {forecast} tides={data.tides} now={app.now} hazard={area.hazard} window={a.window} />
      {#if a.reasons.length}<h3>Por que este nível?</h3><ul>{#each a.reasons as reason}<li>{reason.text}</li>{/each}</ul>{/if}
      {#if app.activeAlerts.length}<h3>Avisos oficiais</h3><ul>{#each app.activeAlerts as alert}<li>{alert.source}: {alert.title}, nível {alert.level}.{#if alert.url} <a href={alert.url} target="_blank" rel="noopener" class="underline">Ler aviso</a>{/if}</li>{/each}</ul>{/if}
      <a class="care-link" href={route} target="_blank" rel="noopener"><span><b>Consultar abrigo</b><span>{shelter.name}</span></span><Icon name="next" class="h-4 w-4" /></a>
      <p class="shelter-note">Confirme com a Defesa Civil se está aberto e o caminho está seguro.</p>
      <p class="shelter-note">O app não substitui a Defesa Civil.</p>
     </div>
    </details>
 {/if}
</div>
