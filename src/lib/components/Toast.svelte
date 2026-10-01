<script lang="ts">
	import { app } from '$lib/app.svelte';
	import Icon from '$lib/Icon.svelte';
</script>

{#if app.toast}
	{#key app.toast.id}
		<div
			class="fixed inset-x-4 bottom-[calc(5.6rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md animate-[toast-in_0.35s_var(--ease-out-soft)_both] items-center gap-3 rounded-lg bg-(--ink) py-3 pr-2 pl-4 font-semibold text-(--bg)"
			role="status"
			aria-live="polite"
		>
			<span class="flex-1">{app.toast.text}</span>
			<button class="grid h-10 w-10 shrink-0 place-items-center" onclick={() => (app.toast = null)} aria-label="Fechar aviso">
				<Icon name="close" class="h-5 w-5" />
			</button>
		</div>
	{/key}
{/if}
