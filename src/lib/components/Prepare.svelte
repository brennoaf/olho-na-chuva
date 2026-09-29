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

<div class="flex flex-col gap-5 pt-[calc(1.25rem+env(safe-area-inset-top))]">
	<Back />
	<header class="flex flex-col gap-1">
		<h1 class="text-[2.2rem] leading-tight font-extrabold">Se preparar</h1>
		<p class="text-lg text-ink-2">Faça antes de o inverno chegar. Na hora da chuva, não dá tempo.</p>
	</header>

	<a class="press flex items-center gap-4 rounded-3xl bg-sea p-5 text-white shadow-lift" href="sms:40199">
		<Icon name="sms" class="h-10 w-10 shrink-0" />
		<span class="flex flex-col leading-snug">
			<b class="text-xl">Receba o alerta por SMS</b>
			<span>Mande o seu CEP para <b>40199</b>. É de graça e é da Defesa Civil.</span>
		</span>
	</a>

	<div class="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-lift">
		<div class="h-3 flex-1 overflow-hidden rounded-full bg-bg">
			<div class="h-full origin-left rounded-full bg-calm-ink transition-transform duration-500" style="transform: scaleX({total ? count / total : 0})"></div>
		</div>
		<b class="tabular-nums">{count}/{total}</b>
	</div>

	{#each groups as group (group.title)}
		<section class="flex flex-col gap-2">
			<h2 class="px-1 text-xl font-extrabold">{group.title}</h2>
			<ul class="flex flex-col gap-2">
				{#each group.items as item (item)}
					{@const checked = done.includes(item)}
					<li>
						<button class={['press flex w-full items-center gap-3 rounded-2xl p-4 text-left', checked ? 'bg-calm text-calm-ink' : 'bg-surface shadow-lift']} onclick={() => toggle(item)} aria-pressed={checked}>
							<span class={['grid h-8 w-8 shrink-0 place-items-center rounded-full border-2', checked ? 'border-calm-ink bg-calm-ink text-white' : 'border-line']}>
								{#if checked}<Icon name="check" class="h-5 w-5" />{/if}
							</span>
							<span class={['text-[1.05rem]', checked && 'line-through decoration-2 opacity-80']}>{item}</span>
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/each}

	<section class="flex flex-col gap-2">
		<h2 class="px-1 text-xl font-extrabold">Telefones</h2>
		{#each CONTACTS as c (c.href)}
			<a class="press flex min-h-16 items-center gap-3 rounded-2xl bg-surface px-4 shadow-lift" href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener">
				<Icon name={c.href.startsWith('http') ? 'whatsapp' : 'phone'} class="h-6 w-6 shrink-0 text-sea" />
				<span class="flex flex-col leading-tight"><b>{c.label}</b><span class="text-ink-2">{c.detail}</span></span>
			</a>
		{/each}
	</section>
</div>
