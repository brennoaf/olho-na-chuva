<script lang="ts">
	import Icon from '$lib/Icon.svelte';
	import PageIntro from './PageIntro.svelte';
</script>

<div class="about-page">
	<PageIntro context="Olho na Chuva" title="Sobre" description="Dados públicos para mostrar a situação da sua área e orientar cuidados." />

	<section class="about-overview glass-surface" aria-label="Como o aplicativo ajuda">
		<div class="about-item">
			<Icon name="weather" class="h-7 w-7" />
			<span><h2>Informação rápida</h2><p>Chuva medida, previsão, maré e avisos oficiais.</p></span>
		</div>
		<div class="about-item">
			<Icon name="shield" class="h-7 w-7" />
			<span><h2>Orientação, não confirmação</h2><p>O nível indica cuidados. Não confirma o que aconteceu na sua rua.</p></span>
		</div>
	</section>

	<section class="about-privacy glass-surface glass-subtle">
		<Icon name="note" class="h-7 w-7" />
		<span><h2>Seus dados ficam no celular</h2><p>Sem cadastro ou login. Compartilhar no WhatsApp é uma escolha sua.</p></span>
	</section>

	<details class="about-disclosure glass-surface glass-subtle">
		<summary><span><Icon name="rain" class="h-6 w-6" />Fontes dos dados</span><Icon name="next" class="h-5 w-5" /></summary>
		<div class="about-disclosure-content">
			<p><b>APAC:</b> chuva medida e avisos.</p>
			<p><b>INMET:</b> avisos meteorológicos.</p>
			<p><b>Open-Meteo:</b> previsão do tempo.</p>
			<p><b>Marinha e Prefeitura do Recife:</b> previsão da maré.</p>
		</div>
	</details>

	<details class="about-disclosure glass-surface glass-subtle">
		<summary><span><Icon name="home" class="h-6 w-6" />Instalar no celular</span><Icon name="next" class="h-5 w-5" /></summary>
		<div class="about-disclosure-content">
			<h2>Android</h2>
			<p>No menu do navegador, toque em Instalar aplicativo ou Adicionar à tela inicial.</p>
			<h2>iPhone</h2>
			<p>No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.</p>
		</div>
	</details>

	<section class="about-help" aria-labelledby="help-heading">
		<h2 id="help-heading">Em caso de perigo</h2>
		<p>Não atravesse áreas alagadas. Se precisar de ajuda, ligue.</p>
		<div class="about-help-actions">
			<a href="tel:08000810060"><Icon name="phone" class="h-6 w-6" /><span><b>Defesa Civil</b><small>0800 081 0060</small></span></a>
			<a href="tel:193"><Icon name="phone" class="h-6 w-6" /><span><b>Bombeiros</b><small>193</small></span></a>
		</div>
	</section>
</div>
