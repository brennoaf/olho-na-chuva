<script lang="ts">
	import { app } from '$lib/app.svelte';
	import { AREAS } from '$lib/areas';
	import { LocationError, currentPosition } from '$lib/geo';
	import Icon from '$lib/Icon.svelte';
	import { km } from '$lib/rain';
	import Back from './Back.svelte';

	let locating = $state(false);
	let here = $state<{ lat: number; lon: number } | null>(null);

	const list = $derived(
		here ? AREAS.map((a) => ({ area: a, km: km(here!, a) })).sort((x, y) => x.km - y.km) : AREAS.map((a) => ({ area: a, km: null as number | null }))
	);

	async function locate() {
		locating = true;
		try {
			here = await currentPosition();
			app.notify('Pronto! As áreas mais perto de você estão no topo.');
		} catch (error) {
			app.notify(error instanceof LocationError ? error.message : 'Não foi possível achar sua localização.', 'erro');
		} finally {
			locating = false;
		}
	}

	const distance = (value: number) => (value < 1 ? `${Math.round(value * 1000)} m` : `${value.toFixed(1).replace('.', ',')} km`);
</script>

<div class="flex flex-col gap-5 pt-[calc(1.25rem+env(safe-area-inset-top))]">
	{#if app.areaId}<Back />{/if}

	<header class="flex flex-col gap-2">
		{#if !app.areaId}
			<div class="flex items-center gap-3">
				<img src="/icon-192.png" alt="" class="h-14 w-14 rounded-2xl" />
				<span class="text-2xl font-extrabold">Olho na Chuva</span>
			</div>
		{/if}
		<h1 class="text-[2.2rem] leading-tight font-extrabold">Onde você mora?</h1>
		<p class="text-lg text-ink-2">O app junta a chuva medida perto de você, a previsão e a maré, e diz em uma palavra se está perigoso.</p>
	</header>

	<button class="press flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-sea text-lg font-bold text-white disabled:opacity-60" onclick={locate} disabled={locating}>
		{#if locating}
			<span class="h-6 w-6 animate-[spin_0.9s_linear_infinite] rounded-full border-[3px] border-white/40 border-t-white"></span> Procurando você…
		{:else}
			<Icon name="gps" class="h-6 w-6" /> Qual fica perto de mim?
		{/if}
	</button>

	<ul class="flex flex-col gap-2">
		{#each list as { area, km: d }, i (area.id)}
			<li class="rise" style="--i:{i}">
				<button
					class={['press flex w-full items-center gap-4 rounded-3xl p-4 text-left shadow-lift', app.areaId === area.id ? 'bg-sea text-white' : 'bg-surface']}
					onclick={() => app.chooseArea(area.id)}
					aria-current={app.areaId === area.id}
				>
					<span class={['grid h-14 w-14 shrink-0 place-items-center rounded-2xl', app.areaId === area.id ? 'bg-white/15' : area.hazard === 'inundacao' ? 'bg-sea-tint text-sea' : 'bg-watch/60 text-watch-ink']}>
						<Icon name={area.hazard === 'inundacao' ? 'wave' : 'hill'} class="h-8 w-8" />
					</span>
					<span class="flex min-w-0 flex-1 flex-col leading-tight">
						<b class="text-xl">{area.name}</b>
						<span class={app.areaId === area.id ? 'opacity-90' : 'text-ink-2'}>
							{area.hazard === 'inundacao' ? 'Alagamento' : 'Deslizamento'} · {area.short}{d !== null ? ` · ${distance(d)}` : ''}
						</span>
					</span>
					<Icon name="next" class="h-5 w-5 shrink-0 opacity-70" />
				</button>
			</li>
		{/each}
	</ul>

	<p class="text-center text-[0.88rem] text-ink-2">A sua escolha fica só neste celular. Não pedimos nome nem telefone.</p>
</div>
