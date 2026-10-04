<script lang="ts">
	let { context, title, description }: { context: string; title: string; description: string } = $props();
</script>

<header class="page-intro">
	<p class="page-context">{context}</p>
	<h1 tabindex="-1">{title}</h1>
	<p>{description}</p>
</header>
