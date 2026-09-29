<script lang="ts">
	import { app } from '$lib/app.svelte';
	import About from '$lib/components/About.svelte';
	import AreaPicker from '$lib/components/AreaPicker.svelte';
	import History from '$lib/components/History.svelte';
	import Home from '$lib/components/Home.svelte';
	import Prepare from '$lib/components/Prepare.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { onMount } from 'svelte';

	onMount(() => app.start());
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
