<script lang="ts">
	import { app } from '$lib/app.svelte';
	import { worst } from '$lib/alerts';
	import { SHELTERS } from '$lib/areas';
	import Icon from '$lib/Icon.svelte';
	import { km } from '$lib/rain';
	import { canSpeak, speak, stopSpeaking } from '$lib/speech';
	import { formatAgo, formatHour } from '$lib/time';
	import { headline, neighborMessage, rows, spoken, WORD } from '$lib/words';
	import Timeline from './Timeline.svelte';

	const area = $derived(app.area!);
	const a = $derived(app.assessment);
	const data = $derived(app.data);
	const station = $derived(app.station);
	const risk = $derived(a?.risk ?? 0);
	const shelter = $derived(SHELTERS.map((s) => ({ ...s, km: km(area, s) })).sort((p, q) => p.km - q.km)[0]!);
	const stale = $derived(data ? app.now - data.fetchedAt > 30 * 60000 : true);
	const table = $derived(data ? rows(area, station, data.tides, data.forecast, worst(data.alerts), app.now, (t) => formatAgo(t, app.now)) : { list: [], source: '' });
	const title = $derived(headline(area.hazard, risk));
	const fit = (word: string, max: number) => `font-size: min(${max}rem, calc((min(100vw, 32rem) - 2.6rem) / ${(word.length * 0.68).toFixed(2)}))`;

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

	const route = $derived(`https://www.google.com/maps/dir/?api=1&destination=${shelter.lat},${shelter.lon}&travelmode=walking`);
</script>

{#if !a || !data}
	<div class="flex min-h-dvh flex-col justify-center gap-4" role="status">
		<span class="h-10 w-10 animate-[spin_0.9s_linear_infinite] rounded-full border-4 border-current border-t-transparent opacity-70"></span>
		<p class="display text-[2.4rem]">olhando a chuva e a maré</p>
	</div>
{:else}
	<div class="flex flex-col pt-[calc(1rem+env(safe-area-inset-top))] pb-32">
		<header class="flex items-center justify-between gap-3 text-[0.95rem] font-bold whitespace-nowrap">
			<a class="press -ml-1 flex min-h-12 min-w-0 items-center gap-1.5 px-1 lowercase" href="#/lugar">
				<span class="truncate">{area.name}</span>
				<Icon name="next" class="h-4 w-4 shrink-0 rotate-90 opacity-70" />
			</a>
			<button class="press flex min-h-12 shrink-0 items-center gap-2 px-1 font-semibold opacity-80" onclick={() => app.refresh(true)} aria-label="Atualizar agora">
				<span>{app.loading ? 'atualizando' : formatAgo(data.fetchedAt, app.now)}</span>
				<Icon name="refresh" class={`h-4 w-4 ${app.loading ? 'animate-[spin_0.9s_linear_infinite]' : ''}`} />
			</button>
		</header>

		<section class="flex flex-col gap-5 pt-6 pb-8" aria-live="polite">
			<h1 class="display whitespace-nowrap" style={fit(WORD[risk], 5.6)}>{WORD[risk]}</h1>
			<p class="display text-[clamp(1.55rem,7.4vw,2.05rem)] leading-[1.02] tracking-[-0.02em]">{title}</p>
			{#if canSpeak()}
				<button class="press -ml-1 flex min-h-12 items-center gap-2 self-start px-1 font-bold underline decoration-2 underline-offset-4" onclick={listen}>
					<Icon name={speaking ? 'stop' : 'volume'} class="h-5 w-5" />
					{speaking ? 'parar' : 'ouvir em voz alta'}
				</button>
			{/if}
		</section>

		{#if risk === 3}
			<a class="press rise -mx-5 mb-2 flex items-center justify-between gap-4 bg-(--ink) px-5 py-6 text-(--bg)" href={route} target="_blank" rel="noopener">
				<span class="flex flex-col gap-1">
					<span class="display text-[2.3rem]">ir para o abrigo</span>
					<span class="font-semibold">{shelter.name}, {shelter.km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km a pé</span>
				</span>
				<Icon name="arrow" class="h-10 w-10 shrink-0" />
			</a>
			<ol class="mb-8">
				{#each ['Desligue a energia no disjuntor.', 'Leve documentos e remédios num saco plástico.', 'Ajude crianças, idosos e acamados a sair primeiro.', 'Não atravesse água correndo. Até a canela já derruba.'] as step, i (step)}
					<li class="hairline flex gap-4 border-b py-3 text-[1.08rem] font-semibold">
						<span class="display w-6 text-[1.4rem] leading-none">{i + 1}</span>
						{step}
					</li>
				{/each}
			</ol>
		{/if}

		{#if stale || app.failed.length}
			<p class="hairline mb-2 flex items-start gap-3 border-y py-3 font-semibold">
				<Icon name="offline" class="mt-0.5 h-5 w-5 shrink-0" />
				{stale ? `Sem internet. Estes dados são de ${formatAgo(data.fetchedAt, app.now)}.` : `Não deu para atualizar: ${app.failed.join(', ')}.`}
			</p>
		{/if}

		<dl>
			{#each table.list as row, i (row.label)}
				<div class="hairline rise flex items-end justify-between gap-4 border-t py-3.5" style="--i:{i}">
					<div class="flex min-w-0 flex-1 flex-col">
						<dt class="text-[0.92rem] font-bold">{row.label}</dt>
						<dd class="text-[0.86rem] leading-snug font-medium opacity-75">{row.detail}</dd>
					</div>
					<dd class="display shrink-0 text-right text-[clamp(1.25rem,6.4vw,1.65rem)] leading-none">{row.value}</dd>
				</div>
			{/each}
		</dl>
		<p class="hairline border-t py-3 text-[0.84rem] font-medium opacity-70">Chuva medida no {table.source}.</p>

		<section class="hairline flex flex-col gap-3 border-t pt-4 pb-6">
			<div class="flex flex-col">
				<h2 class="text-[0.92rem] font-bold">próximas 12 horas</h2>
				{#if a.window}<span class="text-[0.86rem] font-semibold opacity-80">mais cuidado das {formatHour(a.window.from)} às {formatHour(a.window.to)}</span>{/if}
			</div>
			<Timeline forecast={data.forecast} tides={data.tides} now={app.now} hazard={area.hazard} window={a.window} />
		</section>

		{#if a.reasons.length}
			<details class="hairline group border-t py-4">
				<summary class="flex min-h-10 cursor-pointer list-none items-center justify-between font-bold">
					por que {WORD[risk].toLowerCase()}?
					<Icon name="next" class="h-4 w-4 rotate-90 transition-transform group-open:-rotate-90" />
				</summary>
				<ul class="mt-2 flex flex-col gap-2">
					{#each a.reasons as reason (reason.text)}<li class="font-medium">{reason.text}</li>{/each}
				</ul>
			</details>
		{/if}

		<nav class="flex flex-col" aria-label="Mais">
			{#each [['#/preparar', 'se preparar'], ['#/historico', 'quando alagou'], ['#/sobre', 'como funciona']] as [href, label] (href)}
				<a class="hairline press flex min-h-16 items-center justify-between border-t" {href}>
					<span class="display text-[1.5rem]">{label}</span>
					<Icon name="arrow" class="h-6 w-6" />
				</a>
			{/each}
		</nav>
	</div>

	<nav class="hairline fixed inset-x-0 bottom-0 z-30 border-t bg-(--bg) pb-[env(safe-area-inset-bottom)]" aria-label="Ações">
		<div class="mx-auto grid max-w-lg grid-cols-3">
			<button class="press flex min-h-[4.6rem] flex-col items-center justify-center gap-1 text-[0.88rem] font-bold" onclick={warnNeighbors}>
				<Icon name="whatsapp" class="h-7 w-7" /> avisar vizinhos
			</button>
			<a class="press flex min-h-[4.6rem] flex-col items-center justify-center gap-1 text-[0.88rem] font-bold" href="tel:08000810060">
				<Icon name="phone" class="h-7 w-7" /> defesa civil
			</a>
			<a class="press flex min-h-[4.6rem] flex-col items-center justify-center gap-1 text-[0.88rem] font-bold" href={route} target="_blank" rel="noopener">
				<Icon name="home" class="h-7 w-7" /> abrigo
			</a>
		</div>
	</nav>
{/if}
