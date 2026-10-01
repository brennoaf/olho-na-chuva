<script lang="ts">
	import { app } from '$lib/app.svelte';
	import { CONTACTS } from '$lib/areas';
	import Icon from '$lib/Icon.svelte';
	import Back from './Back.svelte';

	const KEY = 'olho-na-chuva:preparo';
	const area = $derived(app.area);

	const groups = $derived([
		{
			title: 'Kit para sair rápido',
			items: ['Documentos e receitas num saco plástico fechado', 'Remédios de uso contínuo para 3 dias', 'Lanterna, pilhas e carregador de celular', 'Água e comida que não estraga']
		},
		area?.hazard === 'deslizamento'
			? {
					title: 'Cuidar da barreira',
					items: ['Não jogar lixo nem água de pia na encosta', 'Pedir lona à Defesa Civil se a barreira estiver exposta', 'Observar rachaduras novas em paredes e no chão', 'Combinar um lugar seguro fora da área de risco']
				}
			: {
					title: 'Cuidar da casa e do canal',
					items: ['Deixar móveis e eletrodomésticos no alto', 'Não jogar lixo no canal: ele entope e transborda', 'Saber onde fica o disjuntor para desligar a energia', 'Combinar um lugar alto para onde ir']
				},
		{
			title: 'Combinar com os vizinhos',
			items: ['Ter um grupo de WhatsApp da rua', 'Saber quem precisa de ajuda: idosos, acamados, crianças', 'Escolher quem avisa o grupo quando o app ficar laranja']
		}
	]);

	function load(): string[] {
		try {
			return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[];
		} catch {
			return [];
		}
	}

	let done = $state<string[]>(load());

	function toggle(item: string) {
		done = done.includes(item) ? done.filter((d) => d !== item) : [...done, item];
		try {
			localStorage.setItem(KEY, JSON.stringify(done));
		} catch {
			return;
		}
	}

	const total = $derived(groups.reduce((n, g) => n + g.items.length, 0));
	const count = $derived(groups.flatMap((g) => g.items).filter((i) => done.includes(i)).length);
</script>

<div class="flex flex-col gap-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-10">
	<Back />
	<header class="flex flex-col gap-3">
		<h1 class="display text-[clamp(3rem,15vw,4.2rem)]">Se preparar</h1>
		<p class="text-[1.1rem] leading-snug font-medium">Faça antes do inverno. Na hora da chuva, não dá tempo.</p>
	</header>

	<a class="press flex items-center justify-between gap-4 rounded-lg bg-(--ink) px-5 py-5 text-(--bg)" href="sms:40199">
		<span class="flex flex-col gap-1">
			<span class="display text-[1.5rem]">Alerta por SMS</span>
			<span class="font-medium">Mande o seu CEP para 40199. É grátis e é da Defesa Civil.</span>
		</span>
		<Icon name="sms" class="h-8 w-8 shrink-0" />
	</a>

	<div class="flex items-end justify-between">
		<span class="display text-[3rem] tabular-nums">{count}/{total}</span>
		<span class="pb-1 font-bold">{count === total ? 'Tudo pronto' : 'feitos'}</span>
	</div>

	{#each groups as group (group.title)}
		<section>
			<h2 class="pb-2 text-[0.92rem] font-bold opacity-75">{group.title}</h2>
			<ul>
				{#each group.items as item (item)}
					{@const checked = done.includes(item)}
					<li>
						<button class="hairline press flex min-h-16 w-full items-center gap-4 border-t py-3 text-left" onclick={() => toggle(item)} aria-pressed={checked}>
							<span class={['grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-current', checked && 'bg-(--ink) text-(--bg)']}>
								{#if checked}<Icon name="check" class="h-4 w-4" />{/if}
							</span>
							<span class={['text-[1.05rem] font-semibold', checked && 'line-through decoration-2 opacity-60']}>{item}</span>
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/each}

	<section>
		<h2 class="pb-2 text-[0.92rem] font-bold opacity-75">Telefones</h2>
		{#each CONTACTS as c (c.href)}
			<a class="hairline press flex min-h-16 items-center justify-between gap-4 border-t py-3" href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener">
				<span class="flex flex-col">
					<span class="font-bold">{c.label}</span>
					<span class="display text-[1.4rem]">{c.detail}</span>
				</span>
				<Icon name={c.href.startsWith('http') ? 'whatsapp' : 'phone'} class="h-6 w-6 shrink-0" />
			</a>
		{/each}
	</section>
</div>
