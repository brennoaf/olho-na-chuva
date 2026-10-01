<script lang="ts">
	import { app } from '$lib/app.svelte';
	import About from '$lib/components/About.svelte';
	import AreaPicker from '$lib/components/AreaPicker.svelte';
	import History from '$lib/components/History.svelte';
	import Home from '$lib/components/Home.svelte';
	import Prepare from '$lib/components/Prepare.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { onMount } from 'svelte';

	const THEMES = [null, null, 'warn', 'danger'] as const;

	const theme = $derived.by(() => {
		if (app.route !== 'inicio' || !app.area || !app.assessment) return null;
		return THEMES[app.assessment.risk];
	});

	onMount(() => app.start());

	$effect(() => {
		const root = document.documentElement;
		if (theme) root.dataset.theme = theme;
		else delete root.dataset.theme;
		const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
		document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#f1efe8');
	});
</script>

{#if app.route === 'lugar' || !app.area}
	<AreaPicker />
{:else if app.route === 'preparar'}
	<Prepare />
{:else if app.route === 'historico'}
	<History />
{:else if app.route === 'sobre'}
	<About />
{:else}
	<Home />
{/if}

<Toast />
