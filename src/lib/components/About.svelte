<script lang="ts">
	import { LIMITS } from '$lib/risk';
	import Back from './Back.svelte';

	const I = LIMITS.inundacao;
	const D = LIMITS.deslizamento;
</script>

<div class="flex flex-col gap-4 pt-[calc(1.25rem+env(safe-area-inset-top))]">
	<Back />
	<h1 class="text-[2.2rem] leading-tight font-extrabold">Como funciona</h1>

	<section class="flex flex-col gap-2 rounded-3xl bg-surface p-5 shadow-lift">
		<h2 class="text-lg font-extrabold">De onde vêm os dados</h2>
		<ul class="flex list-disc flex-col gap-1.5 pl-5">
			<li><b>Chuva medida:</b> pluviômetros da APAC e do Cemaden, atualizados a cada 10 minutos.</li>
			<li><b>Previsão:</b> Open-Meteo, hora a hora.</li>
			<li><b>Maré:</b> tábua do Porto do Recife (Marinha), publicada pela Prefeitura do Recife.</li>
			<li><b>Avisos oficiais:</b> APAC e INMET.</li>
		</ul>
	</section>

	<section class="flex flex-col gap-2 rounded-3xl bg-surface p-5 shadow-lift">
		<h2 class="text-lg font-extrabold">Quando o app diz “Perigo”</h2>
		<p><b>Alagamento:</b> {I.perigo.h24} mm ou mais em 24 horas, {I.perigo.h1} mm em 1 hora, ou {I.perigo.h3WithTide} mm em 3 horas com maré acima de {I.highTide.toLocaleString('pt-BR')} m.</p>
		<p><b>Deslizamento:</b> {D.perigo.h72} mm em 3 dias ou {D.perigo.h24} mm em 24 horas.</p>
		<p class="text-ink-2">
			Esses limites vieram das cheias do Canal do Fragoso de 2025 e 2026: em todas choveu mais de {I.perigo.h24} mm no dia. Eles serão ajustados com os moradores, a partir do que cada um registrar em “Quando alagou”.
		</p>
	</section>

	<section class="flex flex-col gap-2 rounded-3xl bg-surface p-5 shadow-lift">
		<h2 class="text-lg font-extrabold">Privacidade</h2>
		<p>Sem cadastro e sem login. A área escolhida e os seus registros ficam só neste celular.</p>
	</section>

	<p class="rounded-2xl bg-watch p-4 font-bold text-watch-ink">
		Este app ajuda a se preparar, mas não substitui a Defesa Civil. Se a água subir ou a barreira rachar, saia de casa e ligue 0800 081 0060.
	</p>
</div>
