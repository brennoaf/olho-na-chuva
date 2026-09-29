<script lang="ts">
	import { app } from '$lib/app.svelte';
	import { SHELTERS } from '$lib/areas';
	import Icon from '$lib/Icon.svelte';
	import { km } from '$lib/rain';
	import { canSpeak, speak, stopSpeaking } from '$lib/speech';
	import { formatAgo, formatHour, relativeDay } from '$lib/time';
	import { neighborMessage, peakWords, period, rainNow, sentence, spoken, tideWords, WORD } from '$lib/words';
	import Timeline from './Timeline.svelte';

	const area = $derived(app.area!);
	const a = $derived(app.assessment);
	const data = $derived(app.data);
	const station = $derived(app.station);
	const risk = $derived(a?.risk ?? 0);
	const shelter = $derived(SHELTERS.map((s) => ({ ...s, km: km(area, s) })).sort((x, y) => x.km - y.km)[0]);
	const upcoming = $derived(data ? data.tides.filter((t) => t.at >= app.now).slice(0, 4) : []);
	const stale = $derived(data ? app.now - data.fetchedAt > 30 * 60000 : true);

	const POSTER = ['bg-calm text-calm-ink', 'bg-watch text-watch-ink', 'bg-warn text-warn-ink', 'bg-danger text-danger-ink'];

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
		const text = neighborMessage(area, a, station?.station ?? null, data.tides, data.forecast, app.now, shelter?.name ?? 'a escola mais próxima');
		open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
	}

	const route = (lat: number, lon: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=walking`;
</script>

{#if !a || !data}
	<div class="flex min-h-[80dvh] flex-col items-center justify-center gap-4 text-center" role="status">
		<span class="h-12 w-12 animate-[spin_0.9s_linear_infinite] rounded-full border-4 border-sea-tint border-t-sea"></span>
		<p class="text-lg font-bold">Olhando a chuva e a maré…</p>
	</div>
{:else}
	<div class="flex flex-col gap-5 pb-28">
		<section class={['-mx-4 flex flex-col gap-5 rounded-b-[2.5rem] px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-6 transition-colors duration-500', POSTER[risk]]} aria-live="polite">
			<div class="flex items-center justify-between gap-2">
				<a class="press flex min-h-12 items-center gap-2 rounded-full bg-black/8 px-4 font-bold" href="#/lugar">
					<Icon name="pin" class="h-5 w-5" />
					{area.name}
				</a>
				<button class="press flex min-h-12 items-center gap-2 rounded-full bg-black/8 px-4 text-[0.9rem] font-bold" onclick={() => app.refresh(true)} aria-label="Atualizar agora">
					<Icon name="refresh" class={`h-5 w-5 ${app.loading ? 'animate-[spin_0.9s_linear_infinite]' : ''}`} />
					{app.loading ? 'Atualizando' : formatAgo(data.fetchedAt, app.now)}
				</button>
			</div>

			<div class="flex flex-col gap-2">
				<h1 class="text-[clamp(2.9rem,16.5vw,4.4rem)] leading-[0.9] font-extrabold tracking-[-0.04em] uppercase">{WORD[risk]}</h1>
				<p class="text-[1.45rem] leading-snug font-bold">{sentence(area.hazard, risk)}</p>
				{#if a.reasons[0]}<p class="text-[1.05rem] opacity-90">{period(a.reasons[0].text)}</p>{/if}
			</div>

			{#if risk === 3}
				<a class="press relative mx-auto my-2 grid h-52 w-52 place-items-center rounded-full bg-white text-center text-danger" href={route(shelter!.lat, shelter!.lon)} target="_blank" rel="noopener">
					<span class="absolute inset-0 animate-[pulse-ring_1.6s_ease-out_infinite] rounded-full border-4 border-white"></span>
					<span class="flex flex-col items-center gap-1 px-6">
						<Icon name="route" class="h-10 w-10" />
						<b class="text-xl leading-tight">Ir para o abrigo</b>
						<span class="text-[0.85rem] font-bold text-ink-2">{shelter!.name}</span>
					</span>
				</a>
				<ol class="flex flex-col gap-2 rounded-3xl bg-white/12 p-4 text-[1.05rem]">
					<li><b>1.</b> Desligue a energia no disjuntor.</li>
					<li><b>2.</b> Pegue documentos e remédios num saco plástico.</li>
					<li><b>3.</b> Leve crianças, idosos e animais para um lugar alto.</li>
					<li><b>4.</b> Não atravesse água corrente. 20 cm já derrubam uma pessoa.</li>
				</ol>
			{/if}

			{#if canSpeak()}
				<button class="press flex min-h-12 items-center gap-2 self-start rounded-full bg-black/8 px-4 font-bold" onclick={listen}>
					<Icon name={speaking ? 'stop' : 'volume'} class="h-5 w-5" />
					{speaking ? 'Parar' : 'Ouvir'}
				</button>
			{/if}

			<div class="flex flex-col gap-2">
				<h2 class="text-lg font-extrabold">Próximas 12 horas</h2>
				<Timeline forecast={data.forecast} tides={data.tides} now={app.now} hazard={area.hazard} window={a.window} />
				{#if a.window}
					<p class="font-bold">Mais cuidado entre {formatHour(a.window.from)} e {formatHour(a.window.to)}.</p>
				{/if}
			</div>
		</section>

		{#if stale || app.failed.length}
			<p class="flex gap-3 rounded-2xl bg-watch p-4 font-bold text-watch-ink">
				<Icon name="offline" class="mt-0.5 h-5 w-5 shrink-0" />
				{stale ? `Dados de ${formatAgo(data.fetchedAt, app.now)}. Sem internet para atualizar.` : `Não conseguimos atualizar: ${app.failed.join(', ')}.`}
			</p>
		{/if}

		<section class="flex flex-col divide-y divide-line overflow-hidden rounded-3xl bg-surface shadow-lift">
			<div class="flex items-start gap-3 p-4">
				<Icon name="rain" class="mt-0.5 h-7 w-7 shrink-0 text-rain" />
				<div class="flex flex-col leading-snug">
					<b class="text-lg first-letter:uppercase">{rainNow(station?.station ?? null)}</b>
					{#if station}
						<span class="text-ink-2">
							{station.station.h24.toLocaleString('pt-BR')} mm em 24 h · {station.station.h72.toLocaleString('pt-BR')} mm em 3 dias
						</span>
						<span class="text-[0.85rem] text-ink-2">
							Pluviômetro {station.station.name}, a {station.km < 1 ? `${Math.round(station.km * 1000)} m` : `${station.km.toFixed(1).replace('.', ',')} km`} · leitura {formatAgo(station.station.readAt, app.now)}
						</span>
					{:else}
						<span class="text-ink-2">O risco está sendo calculado só pela previsão e pela maré.</span>
					{/if}
				</div>
			</div>
			<div class="flex items-start gap-3 p-4">
				<Icon name="clock" class="mt-0.5 h-7 w-7 shrink-0 text-rain" />
				<div class="flex flex-col leading-snug">
					<b class="text-lg first-letter:uppercase">{peakWords(data.forecast, app.now)}</b>
					<span class="text-[0.85rem] text-ink-2">Previsão por modelo, pode errar em chuva forte e rápida.</span>
				</div>
			</div>
			{#if area.hazard === 'inundacao'}
				<div class="flex items-start gap-3 p-4">
					<Icon name="wave" class="mt-0.5 h-7 w-7 shrink-0 text-sea" />
					<div class="flex min-w-0 flex-1 flex-col gap-2 leading-snug">
						<div class="flex flex-col">
							<b class="text-lg first-letter:uppercase">{tideWords(data.tides, app.now)}</b>
							<span class="text-[0.85rem] text-ink-2">Com maré cheia, a água do canal demora a escoar para o mar.</span>
						</div>
						<ol class="-mr-2 flex gap-1.5 overflow-x-auto pb-1" aria-label="Próximas marés">
							{#each upcoming as t (t.at)}
								<li class={['flex shrink-0 flex-col items-center rounded-2xl px-3 py-1.5 leading-tight', t.high ? 'bg-sea text-white' : 'bg-sea-tint text-sea-deep']}>
									<span class="text-[0.75rem] font-bold opacity-85">{t.high ? 'cheia' : 'vazia'} · {relativeDay(t.at, app.now)}</span>
									<b class="tabular-nums">{formatHour(t.at)}</b>
									<span class="text-[0.78rem] tabular-nums opacity-90">{t.height.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m</span>
								</li>
							{/each}
						</ol>
					</div>
				</div>
			{/if}
			<div class="flex items-start gap-3 p-4">
				<Icon name={data.alerts.length ? 'alert' : 'shield'} class={`mt-0.5 h-7 w-7 shrink-0 ${data.alerts.length ? 'text-danger' : 'text-calm-ink'}`} />
				<div class="flex flex-col gap-1 leading-snug">
					{#if data.alerts.length}
						{#each data.alerts as alert (alert.title + alert.until)}
							<b class="text-lg">{alert.title}: {alert.level}</b>
							{#if alert.url}<a class="font-bold text-sea underline" href={alert.url} target="_blank" rel="noopener">Ler o aviso</a>{/if}
						{/each}
					{:else}
						<b class="text-lg">Nenhum aviso oficial de chuva</b>
						<span class="text-[0.85rem] text-ink-2">APAC e INMET, para Olinda</span>
					{/if}
				</div>
			</div>
		</section>

		{#if a.reasons.length > 1}
			<details class="rounded-3xl bg-surface/70 p-5">
				<summary class="cursor-pointer text-lg font-bold">Por que {WORD[risk].toLowerCase()}?</summary>
				<ul class="mt-3 flex list-disc flex-col gap-1.5 pl-5">
					{#each a.reasons as reason (reason.text)}<li>{reason.text}</li>{/each}
				</ul>
			</details>
		{/if}

		<nav class="grid grid-cols-2 gap-2" aria-label="Mais">
			<a class="press flex min-h-20 flex-col justify-center gap-1 rounded-3xl bg-surface p-4 font-bold shadow-lift" href="#/preparar">
				<Icon name="check" class="h-6 w-6 text-sea" /> Se preparar
			</a>
			<a class="press flex min-h-20 flex-col justify-center gap-1 rounded-3xl bg-surface p-4 font-bold shadow-lift" href="#/historico">
				<Icon name="calendar" class="h-6 w-6 text-sea" /> Quando alagou
			</a>
		</nav>
		<a class="press flex min-h-12 items-center justify-center gap-2 font-bold text-sea" href="#/sobre"><Icon name="info" class="h-5 w-5" /> De onde vêm os dados</a>
	</div>

	<nav class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur" aria-label="Ações">
		<div class="mx-auto grid max-w-lg grid-cols-3 gap-2">
			<button class="press flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl bg-whats text-[0.92rem] leading-tight font-bold text-white" onclick={warnNeighbors}>
				<Icon name="whatsapp" class="h-6 w-6" /> Avisar vizinhos
			</button>
			<a class="press flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl bg-ink text-[0.92rem] leading-tight font-bold text-white" href="tel:08000810060">
				<Icon name="phone" class="h-6 w-6" /> Defesa Civil
			</a>
			<a class="press flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl bg-sea-tint text-[0.92rem] leading-tight font-bold text-sea-deep" href={route(shelter!.lat, shelter!.lon)} target="_blank" rel="noopener">
				<Icon name="home" class="h-6 w-6" /> Abrigo
			</a>
		</div>
	</nav>
{/if}
