<script lang="ts">
	import { app } from '$lib/app.svelte';
	import { worst } from '$lib/alerts';
	import { SHELTERS } from '$lib/areas';
	import Icon from '$lib/Icon.svelte';
	import { km } from '$lib/rain';
	import { canSpeak, speak, stopSpeaking } from '$lib/speech';
	import { formatAgo } from '$lib/time';
	import { headline, levelName, moments, neighborMessage, rows, spoken } from '$lib/words';
	import Scene from './Scene.svelte';
	import Timeline from './Timeline.svelte';

	const area = $derived(app.area!);
	const a = $derived(app.assessment);
	const data = $derived(app.data);
	const station = $derived(app.station);
	const risk = $derived(a?.risk ?? 0);
	const name = $derived(levelName(area.hazard, risk));
	const shelter = $derived(SHELTERS.map((s) => ({ ...s, km: km(area, s) })).sort((p, q) => p.km - q.km)[0]!);
	const stale = $derived(data ? app.now - data.fetchedAt > 30 * 60000 : true);
	const day = $derived(data && a ? moments(area.hazard, station?.station ?? null, data.forecast, data.tides, a.window, app.now) : []);
	const table = $derived(data ? rows(area, station, data.tides, data.forecast, worst(data.alerts), app.now, (t) => formatAgo(t, app.now)) : { list: [], source: '' });
	const raining = $derived((station?.station.h1 ?? 0) > 0);
	const route = $derived(`https://www.google.com/maps/dir/?api=1&destination=${shelter.lat},${shelter.lon}&travelmode=walking`);

	let speaking = $state(false);

	function listen() {
		if (!a || !data) return;
		if (speaking) {
			stopSpeaking();
			speaking = false;
			return;
		}
		speaking = true;
		speak(spoken(area, a, station?.station ?? null, data.tides, data.forecast, app.now), () => (speaking = false));
	}

	function warnNeighbors() {
		if (!a || !data) return;
		const text = neighborMessage(area, a, station?.station ?? null, data.tides, data.forecast, app.now, shelter.name);
		open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
	}

	const sceneLabel = $derived(
		area.hazard === 'inundacao'
			? `Desenho do canal com as casas. ${['Água baixa, céu limpo.', 'Água subindo, céu nublado.', 'Água quase na rua, chuva forte.', 'Água na rua, temporal.'][risk]}`
			: `Desenho do morro com as casas. ${['Céu limpo.', 'Céu nublado.', 'Chuva forte, rachaduras na barreira.', 'Temporal, terra descendo.'][risk]}`
	);

	const links = [
		['#/preparar', 'Se preparar', 'check'],
		['#/historico', 'Quando alagou', 'calendar'],
		['#/sobre', 'Como funciona', 'info']
	] as const;
</script>

{#if !a || !data}
	<div class="flex min-h-dvh flex-col justify-center gap-5" role="status">
		<span class="h-10 w-10 animate-[spin_0.9s_linear_infinite] rounded-full border-4 border-current border-t-transparent opacity-60"></span>
		<p class="display text-[2.2rem]">Olhando a chuva e a maré</p>
	</div>
{:else}
	<div class="flex flex-col pb-32">
		<header class="flex items-center justify-between gap-3 pt-[calc(0.5rem+env(safe-area-inset-top))] text-[0.95rem] whitespace-nowrap">
			<a class="press -ml-1 flex min-h-12 min-w-0 items-center gap-1.5 px-1 font-bold" href="#/lugar">
				<Icon name="pin" class="h-5 w-5 shrink-0" />
				<span class="truncate">{area.name}</span>
				<Icon name="next" class="h-4 w-4 shrink-0 rotate-90" />
			</a>
			<button class="press grid h-12 w-12 shrink-0 place-items-center" onclick={() => app.refresh(true)} aria-label="Atualizar agora">
				<Icon name="refresh" class={`h-6 w-6 ${app.loading ? 'animate-[spin_0.9s_linear_infinite]' : ''}`} />
			</button>
		</header>

		<div class="-mx-5 overflow-hidden">
			<Scene hazard={area.hazard} {risk} {raining} label={sceneLabel} />
		</div>

		<section class="flex flex-col gap-3 pt-6 pb-6" aria-live="polite">
			<h1 class="display text-[clamp(2.4rem,11.5vw,3.4rem)]">
				{#if risk === 1}<span class="box-decoration-clone bg-(--color-watch) px-1.5">{name}</span>{:else}{name}{/if}
			</h1>
			<p class="text-[1.3rem] leading-snug font-semibold">{headline(area.hazard, risk)}</p>
			<p class="text-[0.92rem] font-medium opacity-70">{app.loading ? 'Atualizando agora' : `Atualizado ${formatAgo(data.fetchedAt, app.now)}`}</p>
			{#if canSpeak()}
				<button class="press -ml-1 flex min-h-12 items-center gap-2 self-start px-1 font-bold underline decoration-2 underline-offset-4" onclick={listen}>
					<Icon name={speaking ? 'stop' : 'volume'} class="h-6 w-6" />
					{speaking ? 'Parar' : 'Ouvir em voz alta'}
				</button>
			{/if}
		</section>

		{#if risk === 3}
			<div class="flex flex-col gap-2 pb-6">
				<a class="press flex min-h-20 items-center justify-between gap-4 rounded-xl bg-(--ink) px-5 py-4 text-(--bg)" href={route} target="_blank" rel="noopener">
					<span class="flex flex-col">
						<span class="display text-[1.5rem]">Ir para o abrigo</span>
						<span class="font-semibold">{shelter.name}, {shelter.km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km a pé</span>
					</span>
					<Icon name="route" class="h-8 w-8 shrink-0" />
				</a>
				<a class="press flex min-h-16 items-center justify-between gap-4 rounded-xl border-2 border-current px-5 font-bold" href="tel:08000810060">
					Ligar para a Defesa Civil
					<Icon name="phone" class="h-6 w-6 shrink-0" />
				</a>
			</div>
		{:else if risk === 2}
			<div class="pb-6">
				<button class="press flex min-h-20 w-full items-center justify-between gap-4 rounded-xl bg-(--ink) px-5 py-4 text-left text-(--bg)" onclick={warnNeighbors}>
					<span class="flex flex-col">
						<span class="display text-[1.5rem]">Avisar os vizinhos</span>
						<span class="font-semibold">Manda uma mensagem pronta no WhatsApp</span>
					</span>
					<Icon name="whatsapp" class="h-8 w-8 shrink-0" />
				</button>
			</div>
		{/if}

		{#if stale || app.failed.length}
			<p class="mb-6 flex items-start gap-3 rounded-xl border-2 border-current p-4 font-semibold">
				<Icon name="offline" class="mt-0.5 h-5 w-5 shrink-0" />
				{stale ? `Sem internet. O que você vê é de ${formatAgo(data.fetchedAt, app.now)}.` : 'Parte dos dados não atualizou. Tente de novo daqui a pouco.'}
			</p>
		{/if}

		<section class="flex flex-col gap-1 pb-6">
			<h2 class="pb-2 text-[1.05rem] font-bold">Próximas horas</h2>
			<ol class="relative">
				{#each day as moment, i (moment.when + moment.text)}
					<li class="rise relative flex gap-4 pb-5 last:pb-0" style="--i:{i}">
						{#if i < day.length - 1}<span class="absolute top-9 bottom-0 left-[1.1rem] w-0.5 bg-current opacity-20" aria-hidden="true"></span>{/if}
						<span class={['relative grid h-9 w-9 shrink-0 place-items-center rounded-full', moment.strong ? 'bg-(--ink) text-(--bg)' : 'border-2 border-current']}>
							<Icon name={moment.icon} class="h-5 w-5" />
						</span>
						<span class="flex flex-col pt-0.5 leading-snug">
							<span class="text-[0.95rem] font-bold">{moment.when}</span>
							<span class={['text-[1.15rem]', moment.strong ? 'font-bold' : 'font-medium']}>{moment.text}</span>
						</span>
					</li>
				{/each}
			</ol>
		</section>

		<details class="hairline group border-t">
			<summary class="flex min-h-16 cursor-pointer list-none items-center justify-between font-bold">
				Ver os números
				<Icon name="next" class="h-5 w-5 rotate-90 transition-transform group-open:-rotate-90" />
			</summary>
			<div class="flex flex-col gap-5 pb-6">
				<dl>
					{#each table.list as row (row.label)}
						<div class="hairline flex items-baseline justify-between gap-4 border-t py-3">
							<dt class="flex flex-col">
								<span class="font-bold first-letter:uppercase">{row.label}</span>
								<span class="text-[0.9rem] opacity-75">{row.detail}</span>
							</dt>
							<dd class="shrink-0 text-right text-[1.1rem] font-bold first-letter:uppercase">{row.value}</dd>
						</div>
					{/each}
				</dl>
				<p class="text-[0.9rem] opacity-75">Chuva medida no {table.source}.</p>
				<Timeline forecast={data.forecast} tides={data.tides} now={app.now} hazard={area.hazard} window={a.window} />
				{#if a.reasons.length}
					<div>
						<p class="pb-1 font-bold">Por que este nível</p>
						<ul class="flex list-disc flex-col gap-1 pl-5">
							{#each a.reasons as reason (reason.text)}<li>{reason.text}</li>{/each}
						</ul>
					</div>
				{/if}
			</div>
		</details>

		<nav class="flex flex-col" aria-label="Mais">
			{#each links as [href, label, icon] (href)}
				<a class="hairline press flex min-h-16 items-center gap-3 border-t font-bold" {href}>
					<Icon name={icon} class="h-6 w-6 shrink-0" />
					<span class="flex-1 text-[1.1rem]">{label}</span>
					<Icon name="next" class="h-5 w-5 shrink-0" />
				</a>
			{/each}
		</nav>
	</div>

	<nav class="hairline fixed inset-x-0 bottom-0 z-30 border-t bg-(--bg) pb-[env(safe-area-inset-bottom)]" aria-label="Ações">
		<div class="mx-auto grid max-w-lg grid-cols-3">
			<button class="press flex min-h-[4.6rem] flex-col items-center justify-center gap-1 text-[0.9rem] font-bold" onclick={warnNeighbors}>
				<Icon name="whatsapp" class="h-7 w-7" /> Avisar vizinhos
			</button>
			<a class="press flex min-h-[4.6rem] flex-col items-center justify-center gap-1 text-[0.9rem] font-bold" href="tel:08000810060">
				<Icon name="phone" class="h-7 w-7" /> Defesa Civil
			</a>
			<a class="press flex min-h-[4.6rem] flex-col items-center justify-center gap-1 text-[0.9rem] font-bold" href={route} target="_blank" rel="noopener">
				<Icon name="home" class="h-7 w-7" /> Abrigo
			</a>
		</div>
	</nav>
{/if}
