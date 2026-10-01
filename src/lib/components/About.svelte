<script lang="ts">
	import { LIMITS } from '$lib/risk';
	import Back from './Back.svelte';

	const I = LIMITS.inundacao;
	const D = LIMITS.deslizamento;
	const m = (n: number) => n.toLocaleString('pt-BR');

	const sources = [
		['chuva medida', 'Pluviômetros da APAC e do Cemaden, a cada 10 minutos'],
		['previsão', 'Open-Meteo, hora a hora'],
		['maré', 'Tábua do Porto do Recife, da Marinha, publicada pela Prefeitura do Recife'],
		['avisos', 'APAC e INMET']
	];
</script>

<div class="flex flex-col gap-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-10">
	<Back />
	<h1 class="display text-[clamp(3rem,15vw,4.2rem)]">como funciona</h1>

	<section>
		<h2 class="pb-2 text-[0.92rem] font-bold opacity-75">de onde vêm os dados</h2>
		<dl>
			{#each sources as [label, text] (label)}
				<div class="hairline border-t py-3">
					<dt class="display text-[1.35rem]">{label}</dt>
					<dd class="font-medium">{text}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section>
		<h2 class="pb-2 text-[0.92rem] font-bold opacity-75">quando o app diz perigo</h2>
		<div class="hairline border-t py-3">
			<p class="display text-[1.35rem]">alagamento</p>
			<p class="font-medium">{m(I.perigo.h24)} mm em 24 horas, {m(I.perigo.h1)} mm em 1 hora, ou {m(I.perigo.h3WithTide)} mm em 3 horas com maré acima de {m(I.highTide)} m.</p>
		</div>
		<div class="hairline border-t py-3">
			<p class="display text-[1.35rem]">deslizamento</p>
			<p class="font-medium">{m(D.perigo.h72)} mm em 3 dias ou {m(D.perigo.h24)} mm em 24 horas.</p>
		</div>
		<p class="hairline border-t py-3 font-medium opacity-80">
			Esses números saíram das cheias do Canal do Fragoso em 2025 e 2026: em todas choveu mais de {m(I.perigo.h24)} mm no dia. Eles vão ser ajustados com os moradores, a partir do que cada um registrar.
		</p>
	</section>

	<section>
		<h2 class="pb-2 text-[0.92rem] font-bold opacity-75">privacidade</h2>
		<p class="hairline border-t py-3 font-medium">Sem cadastro e sem login. A área escolhida e os seus registros ficam só neste celular.</p>
	</section>

	<p class="rounded-lg bg-(--ink) p-5 text-[1.05rem] font-semibold text-(--bg)">
		O app ajuda a se preparar, mas não substitui a Defesa Civil. Se a água subir ou a barreira rachar, saia de casa e ligue 0800 081 0060.
	</p>
</div>
