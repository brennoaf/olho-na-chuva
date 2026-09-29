<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<main class="mx-auto min-h-dvh max-w-lg px-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
	{@render children()}
</main>
