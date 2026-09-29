<script lang="ts">
	import type { Hour } from '$lib/forecast';
	import { LIMITS, type Hazard } from '$lib/risk';
	import { heightAt, trend, type Extreme } from '$lib/tide';
	import { formatHour, HOUR } from '$lib/time';

	let { forecast, tides, now, hazard, window }: { forecast: Hour[]; tides: Extreme[]; now: number; hazard: Hazard; window: { from: number; to: number } | null } = $props();

	const W = 360;
	const H = 236;
	const BASE = 206;
	const PAD = 6;
	const COL = (W - PAD * 2) / 12;
	const RAIN_MAX = 64;
	const TIDE_SCALE = 46;
	const uid = $props.id();

	const start = $derived(Math.floor(now / HOUR) * HOUR);
	const end = $derived(start + 12 * HOUR);
	const hours = $derived(Array.from({ length: 12 }, (_, i) => forecast.find((h) => h.at === start + i * HOUR) ?? { at: start + i * HOUR, mm: 0, chance: 0 }));
	const x = (t: number) => PAD + ((t - start) / HOUR) * COL;
	const y = (height: number) => BASE - height * TIDE_SCALE;
	const showTide = $derived(hazard === 'inundacao' && tides.length > 0);
	const threshold = y(LIMITS.inundacao.highTide);

	const curve = $derived.by(() => {
		if (!showTide) return [] as [number, number][];
		const points: [number, number][] = [];
		for (let i = 0; i <= 72; i++) {
			const t = start + (i / 6) * HOUR;
			const h = heightAt(tides, t);
			if (h !== null) points.push([x(t), y(h)]);
		}
		return points;
	});

	function smooth(points: [number, number][]): string {
		if (points.length < 2) return '';
		let d = `M${points[0]![0].toFixed(1)},${points[0]![1].toFixed(1)}`;
		for (let i = 1; i < points.length; i++) {
			const [px, py] = points[i - 1]!;
			const [cx, cy] = points[i]!;
			const mx = (px + cx) / 2;
			d += ` Q${px.toFixed(1)},${py.toFixed(1)} ${mx.toFixed(1)},${((py + cy) / 2).toFixed(1)}`;
		}
		const [lx, ly] = points.at(-1)!;
		return `${d} L${lx.toFixed(1)},${ly.toFixed(1)}`;
	}

	const line = $derived(smooth(curve));
	const area = $derived(curve.length > 1 ? `${line} L${curve.at(-1)![0].toFixed(1)},${BASE} L${curve[0]![0].toFixed(1)},${BASE} Z` : '');

	const extremes = $derived(tides.filter((t) => t.at >= start + HOUR / 3 && t.at <= end - HOUR / 3));
	const nowHeight = $derived(showTide ? heightAt(tides, now) : null);
	const direction = $derived(showTide ? trend(tides, now) : null);
	const ticks = $derived(Array.from({ length: 13 }, (_, i) => start + i * HOUR).filter((t) => Number(formatHour(t).replace(/h.*/, '')) % 3 === 0));

	const anchor = (px: number) => (px < 48 ? 'start' : px > W - 48 ? 'end' : 'middle');
	const meters = (value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m`;

	function level(h: Hour): 0 | 1 | 2 | 3 {
		const tide = hazard === 'inundacao' ? (heightAt(tides, h.at + HOUR / 2) ?? 0) : 0;
		let score: 0 | 1 | 2 | 3 = h.mm >= 15 ? 3 : h.mm >= 8 ? 2 : h.mm >= 3 ? 1 : 0;
		if (score > 0 && score < 3 && tide >= LIMITS.inundacao.highTide - 0.4) score = (score + 1) as 1 | 2 | 3;
		return score;
	}

	const tone = ['bg-calm-ink/15', 'bg-watch', 'bg-warn', 'bg-danger'];
	const total = $derived(Math.round(hours.reduce((n, h) => n + h.mm, 0)));
	const label = $derived(
		`Próximas 12 horas: ${total ? `${total} milímetros de chuva previstos` : 'sem chuva prevista'}` +
			(showTide && nowHeight !== null ? `. Maré ${direction ?? ''} em ${meters(nowHeight)} agora.` : '.') +
			extremes.map((e) => ` Maré ${e.high ? 'cheia' : 'vazia'} às ${formatHour(e.at)}, ${meters(e.height)}.`).join('')
	);
</script>

<figure class="flex flex-col gap-2">
	<div class="overflow-hidden rounded-3xl bg-white/75 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)]">
		<svg viewBox="0 0 {W} {H}" class="block h-auto w-full" role="img" aria-label={label}>
			<defs>
				<linearGradient id="sea-{uid}" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0" stop-color="var(--color-sea)" stop-opacity="0.55" />
					<stop offset="1" stop-color="var(--color-sea)" stop-opacity="0.08" />
				</linearGradient>
				<linearGradient id="rain-{uid}" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0" stop-color="var(--color-rain)" stop-opacity="0.35" />
					<stop offset="1" stop-color="var(--color-rain)" stop-opacity="1" />
				</linearGradient>
				<clipPath id="over-{uid}">
					<rect x="0" y="0" width={W} height={threshold} />
				</clipPath>
				<pattern id="hatch-{uid}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
					<rect width="6" height="6" fill="var(--color-sea-deep)" opacity="0.28" />
					<line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-sea-deep)" stroke-width="2.5" opacity="0.55" />
				</pattern>
			</defs>

			{#if window}
				<rect x={Math.max(0, x(window.from))} y="0" width={Math.max(0, Math.min(W, x(window.to)) - Math.max(0, x(window.from)))} height={BASE} fill="var(--color-danger)" opacity="0.09" />
			{/if}

			{#each ticks as t (t)}
				<line x1={x(t)} x2={x(t)} y1="0" y2={BASE} stroke="var(--color-ink)" stroke-width="1" opacity="0.06" />
			{/each}

			{#if showTide && area}
				<path d={area} fill="url(#sea-{uid})" />
				<path d={area} fill="url(#hatch-{uid})" clip-path="url(#over-{uid})" />
				<line x1={PAD} x2={W - PAD} y1={threshold} y2={threshold} stroke="var(--color-sea-deep)" stroke-width="1.5" stroke-dasharray="4 5" opacity="0.8" />
				<text x={PAD + 4} y={threshold - 6} font-size="11" font-weight="800" fill="var(--color-sea-deep)">maré cheia · {meters(LIMITS.inundacao.highTide)}</text>
				<path d={line} fill="none" stroke="var(--color-sea-deep)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

				{#each extremes as e (e.at)}
					{@const px = x(e.at)}
					{@const py = y(e.height)}
					<circle cx={px} cy={py} r="5" fill={e.high ? 'var(--color-sea-deep)' : 'white'} stroke="var(--color-sea-deep)" stroke-width="2.5" />
					{#if e.high}
						<text x={px} y={py - 22} text-anchor={anchor(px)} font-size="11.5" font-weight="800" fill="var(--color-sea-deep)">cheia {formatHour(e.at)}</text>
						<text x={px} y={py - 9} text-anchor={anchor(px)} font-size="11" font-weight="600" fill="var(--color-sea-deep)" opacity="0.85">{meters(e.height)}</text>
					{:else}
						<text x={px} y={py - 22} text-anchor={anchor(px)} font-size="11.5" font-weight="800" fill="var(--color-sea-deep)" opacity="0.8">vazia {formatHour(e.at)}</text>
						<text x={px} y={py - 9} text-anchor={anchor(px)} font-size="11" font-weight="600" fill="var(--color-sea-deep)" opacity="0.7">{meters(e.height)}</text>
					{/if}
				{/each}
			{/if}

			{#each hours as h, i (h.at)}
				{#if h.mm >= 0.3}
					{@const height = Math.max(14, Math.min(RAIN_MAX, h.mm * 7))}
					{@const bx = PAD + i * COL + 6}
					{@const bw = COL - 12}
					<rect x={bx} y="-14" width={bw} height={height + 14} rx={bw / 2} fill="url(#rain-{uid})" style="animation: fall 0.6s var(--ease-out-soft) both; animation-delay: {i * 40}ms" />
					{#if h.mm >= 3}
						<text x={bx + bw / 2} y={height + 13} text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--color-rain)">{Math.round(h.mm)}</text>
					{/if}
				{/if}
			{/each}

			<line x1={x(now)} x2={x(now)} y1="0" y2={BASE} stroke="var(--color-ink)" stroke-width="2" />
			{#if nowHeight !== null}
				<circle cx={x(now)} cy={y(nowHeight)} r="9" fill="var(--color-ink)" opacity="0.12" />
				<circle cx={x(now)} cy={y(nowHeight)} r="5.5" fill="var(--color-ink)" stroke="white" stroke-width="2" />
			{/if}

			<line x1="0" x2={W} y1={BASE} y2={BASE} stroke="var(--color-ink)" stroke-width="1" opacity="0.15" />
			<text x={x(now)} y={H - 10} text-anchor="start" font-size="12" font-weight="800" fill="var(--color-ink)">agora{direction ? ` · ${direction === 'enchendo' ? '↑' : '↓'} ${direction}` : ''}</text>
			{#each ticks.filter((t) => t - now > (direction ? 2.6 : 1.2) * HOUR) as t (t)}
				<text x={x(t)} y={H - 10} text-anchor={anchor(x(t))} font-size="12" font-weight="700" fill="var(--color-ink)" opacity="0.75">{formatHour(t)}</text>
			{/each}
		</svg>
	</div>

	<div class="grid grid-cols-12 gap-[3px] px-[1.6%]" aria-hidden="true">
		{#each hours as h (h.at)}
			<span class={['h-3 rounded-full', tone[level(h)]]}></span>
		{/each}
	</div>

	<figcaption class="flex flex-wrap gap-x-4 gap-y-1 text-[0.86rem] font-bold">
		<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-rain"></span>chuva prevista (mm)</span>
		{#if showTide}
			<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-sea/40"></span>altura da maré</span>
			<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-[repeating-linear-gradient(45deg,var(--color-sea-deep)_0_2px,transparent_2px_5px)]"></span>maré que segura a água</span>
		{/if}
		{#if window}<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-danger/25"></span>horas de mais risco</span>{/if}
	</figcaption>
</figure>
