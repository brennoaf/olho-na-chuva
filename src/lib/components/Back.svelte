<script lang="ts">
	import Icon from '$lib/Icon.svelte';

	let { href = '#/', label = 'voltar' }: { href?: string; label?: string } = $props();
</script>

<a class="press -ml-1 flex min-h-12 items-center gap-1.5 self-start px-1 font-bold" {href}>
	<Icon name="back" class="h-4 w-4" />
	{label}
</a>
