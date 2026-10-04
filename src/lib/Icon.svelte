<script lang="ts">
 import { icons, type IconName } from './icons';
 import { siWhatsapp } from 'simple-icons';
 let { name, class: className = '' }: { name: IconName; class?: string } = $props();
 const Glyph = $derived(name === 'whatsapp' ? null : icons[name]);
</script>
{#if name === 'whatsapp'}
 <svg class={`whatsapp-icon ${className}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d={siWhatsapp.path} /></svg>
{:else if Glyph}
 <Glyph class={className} stroke-width={2} aria-hidden="true" focusable="false" />
{/if}
