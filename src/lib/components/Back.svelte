<script lang="ts">
	import Icon from '$lib/Icon.svelte';

	let { href = '#/', label = 'Voltar' }: { href?: string; label?: string } = $props();
</script>

<a class="header-back press" {href} aria-label={label}>
	<Icon name="back" class="h-5 w-5" />
	{label}
</a>
