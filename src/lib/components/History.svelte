<script lang="ts">
	import { app } from '$lib/app.svelte';
	import Icon from '$lib/Icon.svelte';
	import { formatDay, formatHour } from '$lib/time';
	import Back from './Back.svelte';

	const area = $derived(app.area!);
	const station = $derived(app.station?.station ?? null);
	const mine = $derived(app.reports.filter((r) => r.area === area.id));
	const since = $derived(area.events.at(-1)?.date.slice(0, 4));

	const options = $derived(
		area.hazard === 'inundacao' ? ['A água chegou na rua', 'A água entrou em casa', 'O canal transbordou'] : ['Apareceu rachadura na barreira', 'Desceu terra ou pedra', 'Casa atingida']
	);

	let picking = $state(false);

	function report(note: string) {
		app.addReport(note);
		picking = false;
		const when = `${formatDay(Date.now())}, às ${formatHour(Date.now())}`;
		const text = [
			`*${note}* aqui no ${area.name}, ${when}.`,
			station ? `O pluviômetro ${station.name} marcou ${station.h1.toLocaleString('pt-BR')} mm na última hora e ${station.h24.toLocaleString('pt-BR')} mm em 24 horas.` : '',
			'Registrei no Olho na Chuva para a gente ter o histórico da rua.'
		]
			.filter(Boolean)
			.join('\n\n');
		app.notify('Guardado neste celular. Agora mande para o grupo da rua.');
		open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
	}

	const date = (iso: string) => {
		const [y, m, d] = iso.split('-');
		return `${d}/${m}/${y}`;
	};
</script>

<div class="flex flex-col gap-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-10">
	<Back />
	<header class="flex flex-col gap-3">
		<h1 class="display text-[clamp(3rem,15vw,4.2rem)]">Quando alagou</h1>
		{#if area.events.length}
			<p class="flex items-end gap-3">
				<span class="display text-[4.5rem] leading-[0.8] tabular-nums">{area.events.length}</span>
				<span class="pb-1 text-[1.1rem] leading-tight font-bold">vezes nas notícias<br />desde {since}</span>
			</p>
		{/if}
		<p class="text-[1.05rem] leading-snug font-medium">Cada registro ajuda a acertar o alerta e a cobrar obra do poder público.</p>
	</header>

	{#if picking}
		<section class="rise flex flex-col gap-1 rounded-lg bg-(--ink) p-2 text-(--bg)">
			<span class="px-3 pt-2 pb-1 font-bold">O que aconteceu?</span>
			{#each options as option (option)}
				<button class="press flex min-h-14 items-center justify-between rounded-md px-3 text-left text-[1.1rem] font-bold hover:bg-white/10" onclick={() => report(option)}>
					{option}
					<Icon name="arrow" class="h-5 w-5" />
				</button>
			{/each}
			<button class="press min-h-12 font-semibold opacity-80" onclick={() => (picking = false)}>Cancelar</button>
		</section>
	{:else}
		<button class="press flex min-h-16 items-center justify-between rounded-lg bg-(--ink) px-5 text-(--bg)" onclick={() => (picking = true)}>
			<span class="display text-[1.4rem]">{area.hazard === 'inundacao' ? 'Está alagando agora' : 'A barreira mexeu agora'}</span>
			<Icon name="flag" class="h-6 w-6" />
		</button>
	{/if}

	{#if mine.length}
		<section>
			<h2 class="pb-2 text-[0.92rem] font-bold opacity-75">Registrado por você</h2>
			<ul>
				{#each mine as r (r.at)}
					<li class="hairline flex justify-between gap-3 border-t py-3"><b>{r.note}</b><span class="shrink-0 font-medium opacity-75">{formatDay(r.at)}, {formatHour(r.at)}</span></li>
				{/each}
			</ul>
		</section>
	{/if}

	<section>
		<h2 class="pb-2 text-[0.92rem] font-bold opacity-75">Nas notícias</h2>
		<ol>
			{#each area.events as event, i (event.date + event.url)}
				<li class="hairline rise flex flex-col gap-1 border-t py-4" style="--i:{i}">
					<span class="display text-[1.6rem] tabular-nums">{date(event.date)}</span>
					<p class="font-medium">{event.text}</p>
					<a class="self-start font-bold underline decoration-2 underline-offset-4" href={event.url} target="_blank" rel="noopener">Ler a notícia</a>
				</li>
			{:else}
				<li class="hairline border-t py-4 font-medium opacity-75">Ainda não achamos notícias desta área. Registre quando acontecer.</li>
			{/each}
		</ol>
	</section>
</div>
