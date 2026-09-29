<script lang="ts">
	import { app } from '$lib/app.svelte';
	import Icon from '$lib/Icon.svelte';
	import { formatDay, formatHour } from '$lib/time';
	import Back from './Back.svelte';

	const area = $derived(app.area!);
	const station = $derived(app.station?.station ?? null);
	const mine = $derived(app.reports.filter((r) => r.area === area.id));
	const since = $derived(area.events.at(-1)?.date.slice(0, 4));

	const OPTIONS = $derived(
		area.hazard === 'inundacao'
			? ['A água chegou na rua', 'A água entrou em casa', 'O canal transbordou']
			: ['Apareceu rachadura na barreira', 'Desceu terra ou pedra', 'Casa atingida']
	);

	let picking = $state(false);

	function report(note: string) {
		app.addReport(note);
		picking = false;
		const text = [
			`⚠️ *${note}* · ${area.name}`,
			`${formatDay(Date.now())} às ${formatHour(Date.now())}`,
			station ? `Chuva: ${station.h1.toLocaleString('pt-BR')} mm na última hora, ${station.h24.toLocaleString('pt-BR')} mm em 24 h (pluviômetro ${station.name})` : '',
			'',
			'Registrado pelo app Olho na Chuva'
		]
			.filter(Boolean)
			.join('\n');
		app.notify('Registrado neste celular. Agora mande para o grupo da rua.');
		open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
	}

	const date = (iso: string) => {
		const [y, m, d] = iso.split('-');
		return `${d}/${m}/${y}`;
	};
</script>

<div class="flex flex-col gap-5 pt-[calc(1.25rem+env(safe-area-inset-top))]">
	<Back />
	<header class="flex flex-col gap-2">
		<h1 class="text-[2.2rem] leading-tight font-extrabold">Quando alagou</h1>
		{#if area.events.length}
			<p class="text-[1.35rem] leading-snug font-bold">
				{area.name}: <span class="text-danger">{area.events.length} vezes nas notícias</span> desde {since}.
			</p>
		{/if}
		<p class="text-ink-2">Cada registro ajuda a acertar o alerta e a cobrar obra do poder público.</p>
	</header>

	{#if picking}
		<section class="rise flex flex-col gap-2 rounded-3xl bg-danger p-5 text-white shadow-lift">
			<b class="text-xl">O que aconteceu?</b>
			{#each OPTIONS as option (option)}
				<button class="press min-h-14 rounded-2xl bg-white px-4 text-left text-lg font-bold text-danger" onclick={() => report(option)}>{option}</button>
			{/each}
			<button class="press min-h-12 font-bold" onclick={() => (picking = false)}>Cancelar</button>
		</section>
	{:else}
		<button class="press flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-danger text-lg font-bold text-white" onclick={() => (picking = true)}>
			<Icon name="flag" class="h-6 w-6" />
			{area.hazard === 'inundacao' ? 'Está alagando agora' : 'A barreira mexeu agora'}
		</button>
	{/if}

	{#if mine.length}
		<section class="flex flex-col gap-2">
			<h2 class="px-1 text-xl font-extrabold">Registrado por você</h2>
			<ul class="flex flex-col divide-y divide-line rounded-3xl bg-surface shadow-lift">
				{#each mine as r (r.at)}
					<li class="flex justify-between gap-3 px-4 py-3"><b>{r.note}</b><span class="shrink-0 text-ink-2">{formatDay(r.at)} {formatHour(r.at)}</span></li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="flex flex-col gap-3">
		<h2 class="px-1 text-xl font-extrabold">Nas notícias</h2>
		<ol class="relative flex flex-col gap-4 border-l-4 border-sea-tint pl-5">
			{#each area.events as event, i (event.date)}
				<li class="rise relative" style="--i:{i}">
					<span class="absolute top-1.5 -left-[1.95rem] h-5 w-5 rounded-full border-4 border-bg bg-danger"></span>
					<b class="text-lg">{date(event.date)}</b>
					<p>{event.text}</p>
					<a class="text-[0.9rem] font-bold text-sea underline" href={event.url} target="_blank" rel="noopener">Ver a notícia</a>
				</li>
			{:else}
				<li class="text-ink-2">Ainda não achamos notícias desta área. Registre quando acontecer.</li>
			{/each}
		</ol>
	</section>
</div>
