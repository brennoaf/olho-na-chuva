<script lang="ts">
	import { app } from '$lib/app.svelte';
	import { AREAS } from '$lib/areas';
	import { LocationError, currentPosition } from '$lib/geo';
	import Icon from '$lib/Icon.svelte';
	import { km } from '$lib/rain';
	import Back from './Back.svelte';

	let locating = $state(false);
	let here = $state<{ lat: number; lon: number } | null>(null);

	const list = $derived(here ? AREAS.map((a) => ({ area: a, km: km(here!, a) })).sort((p, q) => p.km - q.km) : AREAS.map((a) => ({ area: a, km: null as number | null })));
	const groups = $derived(
		here
			? [{ title: 'Mais perto de você', items: list }]
			: [
					{ title: 'Onde alaga', items: list.filter((i) => i.area.hazard === 'inundacao') },
					{ title: 'Onde a barreira desce', items: list.filter((i) => i.area.hazard === 'deslizamento') }
				]
	);

	async function locate() {
		locating = true;
		try {
			here = await currentPosition();
		} catch (error) {
			app.notify(error instanceof LocationError ? error.message : 'Não foi possível achar sua localização.', 'erro');
		} finally {
			locating = false;
		}
	}

	const distance = (value: number) => (value < 1 ? `${Math.round(value * 1000)} m` : `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`);
</script>

<div class="flex flex-col gap-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-10">
	{#if app.areaId}<Back />{/if}

	<header class="flex flex-col gap-4 pt-2">
		{#if !app.areaId}<span class="text-[0.95rem] font-bold">Olho na Chuva</span>{/if}
		<h1 class="display text-[clamp(3rem,15vw,4.2rem)]">Onde você mora?</h1>
		<p class="text-[1.1rem] leading-snug font-medium">O app olha a chuva medida perto de você, a previsão e a maré, e responde em uma palavra se está perigoso.</p>
	</header>

	<button class="press flex min-h-16 items-center justify-between rounded-lg bg-(--ink) px-5 text-(--bg) disabled:opacity-60" onclick={locate} disabled={locating}>
		<span class="display text-[1.2rem] whitespace-nowrap">{locating ? 'Procurando você' : 'Usar minha localização'}</span>
		{#if locating}
			<span class="h-6 w-6 animate-[spin_0.9s_linear_infinite] rounded-full border-[3px] border-current border-t-transparent"></span>
		{:else}
			<Icon name="gps" class="h-6 w-6" />
		{/if}
	</button>

	{#each groups as group (group.title)}
		<section class="flex flex-col">
			<h2 class="pb-2 text-[0.92rem] font-bold opacity-75">{group.title}</h2>
			<ul>
				{#each group.items as { area, km: d }, i (area.id)}
					<li class="rise" style="--i:{i}">
						<button class="hairline press flex min-h-[4.5rem] w-full items-center justify-between gap-4 border-t py-3 text-left" onclick={() => app.chooseArea(area.id)} aria-current={app.areaId === area.id}>
							<span class="flex min-w-0 flex-col">
								<span class="display text-[1.45rem] leading-tight">{area.name}</span>
								<span class="mt-1 text-[0.9rem] font-medium opacity-75">
									{area.short}{d !== null ? `, a ${distance(d)}` : ''}{here ? (area.hazard === 'inundacao' ? ', alagamento' : ', deslizamento') : ''}
								</span>
							</span>
							{#if app.areaId === area.id}
								<span class="shrink-0 rounded-full bg-(--ink) px-3 py-1 text-[0.8rem] font-bold text-(--bg)">Sua área</span>
							{:else}
								<Icon name="arrow" class="h-6 w-6 shrink-0" />
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/each}

	<p class="text-[0.9rem] font-medium opacity-70">A área escolhida fica só neste celular. Não pedimos nome nem telefone.</p>
</div>
