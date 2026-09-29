<script lang="ts">
	import type { Hour } from '$lib/forecast';
	import { LIMITS, type Hazard } from '$lib/risk';
	import { heightAt, type Extreme } from '$lib/tide';
	import { formatHour, HOUR } from '$lib/time';

	let { forecast, tides, now, hazard, window }: { forecast: Hour[]; tides: Extreme[]; now: number; hazard: Hazard; window: { from: number; to: number } | null } = $props();

	const W = 360;
	const H = 190;
	const COL = W / 12;
	const RAIN_MAX = 88;
	const TIDE_SCALE = 44;

	const start = $derived(Math.floor(now / HOUR) * HOUR);
	const hours = $derived(Array.from({ length: 12 }, (_, i) => forecast.find((h) => h.at === start + i * HOUR) ?? { at: start + i * HOUR, mm: 0, chance: 0 }));
	const x = (t: number) => ((t - start) / HOUR) * COL;
	const showTide = $derived(hazard === 'inundacao' && tides.length > 0);

	const tidePath = $derived.by(() => {
		if (!showTide) return '';
		const points: string[] = [];
		for (let i = 0; i <= 48; i++) {
			const t = start + (i / 4) * HOUR;
			const h = heightAt(tides, t);
			if (h === null) continue;
			points.push(`${x(t).toFixed(1)},${(H - h * TIDE_SCALE).toFixed(1)}`);
		}
		if (points.length < 2) return '';
		const first = points[0]!.split(',')[0];
		const last = points.at(-1)!.split(',')[0];
		return `M${first},${H} L${points.join(' L')} L${last},${H} Z`;
	});

	const highs = $derived(tides.filter((t) => t.high && t.at >= start && t.at <= start + 12 * HOUR));
	const threshold = H - LIMITS.inundacao.highTide * TIDE_SCALE;

	function level(h: Hour): 0 | 1 | 2 | 3 {
		const tide = hazard === 'inundacao' ? (heightAt(tides, h.at + HOUR / 2) ?? 0) : 0;
		let score: 0 | 1 | 2 | 3 = h.mm >= 15 ? 3 : h.mm >= 8 ? 2 : h.mm >= 3 ? 1 : 0;
		if (score > 0 && tide >= LIMITS.inundacao.highTide - 0.4 && score < 3) score = (score + 1) as 1 | 2 | 3;
		return score;
	}

	const tone = ['bg-calm-ink/15', 'bg-watch', 'bg-warn', 'bg-danger'];
	const total = $derived(Math.round(hours.reduce((n, h) => n + h.mm, 0)));
</script>

<figure class="flex flex-col gap-2">
	<div class="relative overflow-hidden rounded-3xl bg-white/70">
		<svg viewBox="0 0 {W} {H}" class="block h-auto w-full" role="img" aria-label="Próximas 12 horas: chuva prevista de {total} milímetros{showTide ? ' e a maré' : ''}">
			{#if window}
				<rect x={Math.max(0, x(window.from))} y="0" width={Math.min(W, x(window.to)) - Math.max(0, x(window.from))} height={H} fill="var(--color-danger)" opacity="0.1" />
			{/if}
			{#if showTide}
				<path d={tidePath} fill="var(--color-sea)" opacity="0.22" />
				<line x1="0" x2={W} y1={threshold} y2={threshold} stroke="var(--color-sea-deep)" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.7" />
				<text x={W - 6} y={threshold - 6} text-anchor="end" font-size="11" font-weight="700" fill="var(--color-sea-deep)">maré cheia</text>
				{#each highs as high (high.at)}
					<circle cx={x(high.at)} cy={H - high.height * TIDE_SCALE} r="4.5" fill="var(--color-sea-deep)" />
				{/each}
			{/if}
			{#each hours as h, i (h.at)}
				{#if h.mm >= 0.3}
					{@const height = Math.max(14, Math.min(RAIN_MAX, h.mm * 9))}
					<rect x={i * COL + 7} y="-12" width={COL - 14} height={height + 12} rx={(COL - 14) / 2} fill="var(--color-rain)" opacity={0.45 + Math.min(0.5, h.chance / 200)} style="animation: fall 0.6s var(--ease-out-soft) both; animation-delay: {i * 40}ms" />
				{/if}
			{/each}
			<line x1={x(now)} x2={x(now)} y1="0" y2={H} stroke="var(--color-ink)" stroke-width="2" />
			<text x={x(now) + 5} y={H - 8} font-size="11" font-weight="700" fill="var(--color-ink)">agora</text>
		</svg>
	</div>
	<div class="grid grid-cols-12 gap-[3px]" aria-hidden="true">
		{#each hours as h (h.at)}
			<span class={['h-3 rounded-full', tone[level(h)]]}></span>
		{/each}
	</div>
	<div class="grid grid-cols-4 text-[0.82rem] font-bold opacity-80" aria-hidden="true">
		{#each [0, 3, 6, 9] as i (i)}
			<span>{formatHour(start + i * HOUR)}</span>
		{/each}
	</div>
	<figcaption class="flex flex-wrap gap-x-4 gap-y-1 text-[0.88rem] font-bold">
		<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-rain"></span>chuva prevista</span>
		{#if showTide}<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-sea/40"></span>maré</span>{/if}
		{#if window}<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-danger/25"></span>horas de mais risco</span>{/if}
	</figcaption>
</figure>
