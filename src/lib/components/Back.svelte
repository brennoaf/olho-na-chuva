<script lang="ts">
	import Icon from '$lib/Icon.svelte';

	let { href = '#/', label = 'Início' }: { href?: string; label?: string } = $props();
</script>

<a class="press -ml-2 flex min-h-12 items-center gap-2 self-start rounded-xl px-2 font-bold text-sea" {href}>
	<Icon name="back" class="h-5 w-5" />
	{label}
</a>
