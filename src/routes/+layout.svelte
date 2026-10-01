<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<main class="mx-auto min-h-dvh max-w-lg overflow-x-clip px-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
	{@render children()}
</main>
