<script lang="ts">
	import { app } from '$lib/app.svelte';
	import Icon from '$lib/Icon.svelte';
</script>

{#if app.toast}
	{#key app.toast.id}
		<div
			class={[
				'fixed inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md animate-[toast-in_0.45s_var(--ease-spring)_both] items-center gap-3 rounded-2xl px-4 py-3 font-bold shadow-lift',
				app.toast.tone === 'erro' ? 'bg-danger text-white' : app.toast.tone === 'info' ? 'bg-ink text-white' : 'bg-calm-ink text-white'
			]}
			role="status"
			aria-live="polite"
		>
			<Icon name={app.toast.tone === 'erro' ? 'alert' : app.toast.tone === 'info' ? 'info' : 'check'} class="h-6 w-6 shrink-0" />
			<span class="flex-1">{app.toast.text}</span>
			<button class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15" onclick={() => (app.toast = null)} aria-label="Fechar aviso">
				<Icon name="close" class="h-5 w-5" />
			</button>
		</div>
	{/key}
{/if}
