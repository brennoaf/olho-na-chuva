<script lang="ts">
	import { app } from '$lib/app.svelte';
	import { CONTACTS } from '$lib/areas';
	import Icon from '$lib/Icon.svelte';
	import PageIntro from './PageIntro.svelte';

	const KEY = 'olho-na-chuva:preparo';
	const area = $derived(app.area);
	const risk = $derived(app.assessment?.risk ?? 0);
	const kit = ['Documentos e receitas num saco plástico fechado', 'Remédios de uso contínuo para 3 dias', 'Lanterna, pilhas e carregador de celular', 'Água e comida que não estraga'];
	const groups = $derived([
		area?.hazard === 'deslizamento'
			? {
					title: 'Cuidados com a barreira',
					items: ['Não jogar lixo nem água de pia na encosta', 'Pedir avaliação à Defesa Civil se houver sinais de instabilidade', 'Sair para um local seguro se notar rachaduras novas ou terra se movendo', 'Combinar um lugar seguro fora da área de risco']
				}
			: {
					title: 'Cuidados com a casa e o canal',
					items: ['Deixar móveis e eletrodomésticos no alto antes da água subir', 'Não jogar lixo no canal nem se aproximar para observar a água', 'Desligar a energia apenas se for seguro, sem contato com água', 'Combinar um local alto e um caminho que evite áreas alagadas']
				},
		{
			title: 'Combinar com os vizinhos',
			items: ['Ter um grupo de WhatsApp da rua', 'Saber quem precisa de ajuda: idosos, acamados, crianças', 'Escolher quem avisa o grupo quando o app disser Prepare-se']
		}
	]);
	function load(): string[] {
		try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]; }
		catch { return []; }
	}
	let done = $state<string[]>(load());
	function toggle(item: string) {
		done = done.includes(item) ? done.filter((value) => value !== item) : [...done, item];
		try { localStorage.setItem(KEY, JSON.stringify(done)); } catch {}
	}
</script>

{#snippet checklist(items: string[])}
	<ul class="prepare-list">
		{#each items as item (item)}
			{@const checked = done.includes(item)}
			<li>
				<label class="prepare-check-row">
					<input class="prepare-check-native" type="checkbox" checked={checked} onchange={() => toggle(item)} />
					<span class:checked class="prepare-check-box" aria-hidden="true">{#if checked}<Icon name="check" class="h-5 w-5" />{/if}</span>
					<span class:done={checked}>{item}</span>
				</label>
			</li>
		{/each}
	</ul>
{/snippet}

<div class="prepare-page">
	<PageIntro context={area?.name ?? 'Olho na Chuva'} title="Se preparar" description="Deixe o essencial pronto. Comece pelos quatro primeiros itens." />

	<details class="urgent-help glass-surface" open={risk >= 2}>
		<summary><span><Icon name="alert" class="h-6 w-6" />{risk >= 2 ? 'O que fazer agora' : 'Perigo agora? Veja o que fazer'}</span><Icon name="next" class="h-5 w-5" /></summary>
		<div class="urgent-content">
			{#if area?.hazard === 'deslizamento'}
				<strong>Saia se notar rachaduras novas, árvores inclinadas ou terra se movendo.</strong>
				<p>Vá para um local seguro. Não volte sem orientação da Defesa Civil.</p>
			{:else}
				<strong>Não atravesse ruas alagadas.</strong>
				<p>Se a água subir, procure um local alto sem entrar na água.</p>
			{/if}
			<div class="urgent-actions">
				<a href="tel:08000810060"><Icon name="phone" class="h-6 w-6" /><span><b>Defesa Civil</b><small>0800 081 0060</small></span></a>
				<a href="tel:193"><Icon name="phone" class="h-6 w-6" /><span><b>Bombeiros</b><small>193</small></span></a>
			</div>
		</div>
	</details>

	<section class="prepare-kit" aria-labelledby="kit">
		<div class="prepare-heading">
			<h2 id="kit" tabindex="-1">Para sair rápido</h2>
		</div>
		{@render checklist(kit)}
	</section>

	<section class="more-preparation" aria-labelledby="more-heading">
		<h2 id="more-heading">Outros preparativos</h2>
		{#each groups as group (group.title)}
			<details class="prepare-group">
				<summary><span>{group.title}</span><Icon name="next" class="h-5 w-5" /></summary>
				{@render checklist(group.items)}
			</details>
		{/each}
	</section>

	<section class="prepare-service" aria-labelledby="sms-heading">
		<h2 id="sms-heading">Alerta oficial por SMS</h2>
		<a class="service-row" href="sms:40199">
			<Icon name="sms" class="h-6 w-6" />
			<span><b>Enviar CEP para 40199</b><small>Serviço da Defesa Civil</small></span>
			<Icon name="next" class="h-5 w-5" />
		</a>
	</section>

	<section class="prepare-service" aria-labelledby="phones-heading">
		<h2 id="phones-heading">Outros telefones úteis</h2>
		<div class="contact-list">
			{#each CONTACTS.filter((contact) => !['tel:08000810060', 'tel:193'].includes(contact.href)) as contact (contact.href)}
				<a href={contact.href} target={contact.href.startsWith('http') ? '_blank' : undefined} rel="noopener">
					<span><b>{contact.label}</b><small>{contact.detail}</small></span>
					<Icon name={contact.href.startsWith('http') ? 'whatsapp' : 'phone'} class="h-6 w-6" />
				</a>
			{/each}
		</div>
	</section>
</div>
