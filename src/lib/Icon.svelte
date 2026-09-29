<script lang="ts">
	import { icons, ICON_VIEWBOX, type IconName } from './icons';

	let { name, class: className = '' }: { name: IconName; class?: string } = $props();
</script>

<svg class={className} viewBox={ICON_VIEWBOX} aria-hidden="true" focusable="false">{@html icons[name]}</svg>
