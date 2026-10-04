<script lang="ts">
	import { app } from '$lib/app.svelte';
	import Icon from '$lib/Icon.svelte';
	import { formatDay, formatHour } from '$lib/time';
	import { tick } from 'svelte';

	const area = $derived(app.area!);
	const mine = $derived(app.reports.filter((r) => r.area === area.id));

	const options = $derived(
		area.hazard === 'inundacao'
			? [
					{ label: 'A água chegou na rua', icon: 'wave' as const },
					{ label: 'A água entrou em casa', icon: 'home' as const },
					{ label: 'O canal transbordou', icon: 'rain' as const }
				]
			: [
					{ label: 'Apareceu rachadura na barreira', icon: 'hill' as const },
					{ label: 'Desceu terra ou pedra', icon: 'alert' as const },
					{ label: 'Casa atingida', icon: 'home' as const }
				]
	);

	let picking = $state(false);
	let saved = $state<ReturnType<typeof app.addReport>>();

	async function report(note: string) {
		saved = app.addReport(note);
		picking = false;
		await tick();
		const confirmation = document.getElementById('report-saved');
		confirmation?.focus({ preventScroll: true });
		confirmation?.scrollIntoView({ block: 'start' });
	}

	function shareReport(report: { note: string; at: number }) {
		const text = `${area.name}: ${report.note}.\nRegistro de ${formatDay(report.at)}, às ${formatHour(report.at)}.\nFonte: relato de morador, sem verificação independente.`;
		open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
	}

	async function undoReport() {
		if (!saved) return;
		app.removeReport(saved.at);
		saved = undefined;
		app.notify('Registro desfeito.');
		await tick();
		document.getElementById('new-report')?.focus();
	}

</script>

<div class="history-page">
	<header class="history-intro">
		<p class="eyebrow">{area.name}</p>
		<h1 tabindex="-1">Registros</h1>
		<p>Anote o que aconteceu na sua rua. Fica só neste celular.</p>
	</header>

	{#if picking}
		<section class="history-picker" aria-labelledby="report-question">
			<div class="history-picker-heading"><Icon name="flag" class="h-6 w-6" /><h2 id="report-question">O que aconteceu?</h2><button aria-label="Cancelar" onclick={() => (picking = false)}><Icon name="close" class="h-5 w-5" /></button></div>
			{#each options as option (option)}
				<button class="history-option press" onclick={() => report(option.label)}>
					<Icon name={option.icon} class="h-6 w-6" />
					<span>{option.label}</span>
					<Icon name="next" class="h-5 w-5" />
				</button>
			{/each}
		</section>
	{:else}
		<button id="new-report" class="history-new press" onclick={() => (picking = true)}>
			<span class="history-new-icon"><Icon name="flag" class="h-6 w-6" /></span>
			<strong>Fazer um registro</strong>
			<Icon name="next" class="h-5 w-5" />
		</button>
	{/if}

	{#if saved}
		<section class="report-confirmation" aria-labelledby="report-saved">
			<div class="report-confirmation-heading">
				<span class="report-confirmation-icon"><Icon name="check" class="h-6 w-6" /></span>
				<span><h2 id="report-saved" tabindex="-1">Salvo neste celular</h2><small>{saved.note}</small></span>
			</div>
			<div class="report-actions">
				<button class="report-action" onclick={() => saved && shareReport(saved)}><Icon name="whatsapp" class="h-6 w-6" />Compartilhar no WhatsApp</button>
				<button class="report-action" onclick={undoReport}><Icon name="undo" class="h-5 w-5" />Desfazer registro</button>
			</div>
		</section>
	{/if}

	{#if mine.some(r => r.at !== saved?.at)}
		<section class="history-section">
			<h2>Registrado por você</h2>
			<ul class="personal-reports">
				{#each mine.filter(r => r.at !== saved?.at) as r (r.at)}
					<li><span><b>{r.note}</b><small>{formatDay(r.at)}, {formatHour(r.at)}</small></span><button class="report-share" aria-label={`Compartilhar registro: ${r.note}, ${formatDay(r.at)} às ${formatHour(r.at)}`} onclick={() => shareReport(r)}><Icon name="whatsapp" class="h-6 w-6" /></button></li>
				{/each}
			</ul>
		</section>
	{/if}

</div>
