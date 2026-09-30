<script lang="ts">
	import type { Hour } from '$lib/forecast';
	import { LIMITS, type Hazard } from '$lib/risk';
	import { heightAt, trend, type Extreme } from '$lib/tide';
	import { formatHour, HOUR } from '$lib/time';

	let { forecast, tides, now, hazard, window }: { forecast: Hour[]; tides: Extreme[]; now: number; hazard: Hazard; window: { from: number; to: number } | null } = $props();

	const W = 360;
	const PAD = 10;
	const SPAN = 13;
	const COL = (W - PAD * 2) / SPAN;
	const uid = $props.id();

	const RAIN_TOP = 14;
	const RAIN_BASE = 70;
	const TIDE_TOP = 112;
	const TIDE_BASE = 196;

	const showTide = $derived(hazard === 'inundacao' && tides.length > 0);
	const plotBottom = $derived(showTide ? TIDE_BASE : RAIN_BASE);
	const H = $derived(plotBottom + 34);

	const start = $derived(Math.floor(now / HOUR) * HOUR - HOUR);
	const end = $derived(start + SPAN * HOUR);
	const x = (t: number) => PAD + ((t - start) / HOUR) * COL;
	const hours = $derived(Array.from({ length: SPAN }, (_, i) => forecast.find((h) => h.at === start + i * HOUR) ?? { at: start + i * HOUR, mm: 0, chance: 0 }));
	const rainTotal = $derived(hours.filter((h) => h.at >= now - HOUR).reduce((n, h) => n + h.mm, 0));
	const hasBars = $derived(hours.some((h) => h.mm >= 0.3));
	const rainHeight = (mm: number) => Math.max(5, Math.min(RAIN_BASE - RAIN_TOP - 14, mm * 4));

	const top = $derived(Math.max(2.6, ...tides.filter((t) => t.at >= start - 6 * HOUR && t.at <= end + 6 * HOUR).map((t) => t.height + 0.15)));
	const y = (height: number) => TIDE_BASE - (height / top) * (TIDE_BASE - TIDE_TOP);
	const threshold = $derived(y(LIMITS.inundacao.highTide));

	const curve = $derived.by(() => {
		if (!showTide) return [] as [number, number][];
		const points: [number, number][] = [];
		for (let i = 0; i <= SPAN * 4; i++) {
			const t = start + (i / 4) * HOUR;
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
			d += ` Q${px.toFixed(1)},${py.toFixed(1)} ${((px + cx) / 2).toFixed(1)},${((py + cy) / 2).toFixed(1)}`;
		}
		const [lx, ly] = points.at(-1)!;
		return `${d} L${lx.toFixed(1)},${ly.toFixed(1)}`;
	}

	const line = $derived(smooth(curve));
	const area = $derived(curve.length > 1 ? `${line} L${curve.at(-1)![0].toFixed(1)},${TIDE_BASE} L${curve[0]![0].toFixed(1)},${TIDE_BASE} Z` : '');
	const extremes = $derived(tides.filter((t) => t.at >= now + HOUR / 3 && t.at <= end - HOUR / 3));
	const nowHeight = $derived(showTide ? heightAt(tides, now) : null);
	const direction = $derived(showTide ? trend(tides, now) : null);

	const thresholdFree = $derived(!extremes.some((e) => x(e.at) > W - 70) && x(now) < W - 70);

	const ticks = $derived(Array.from({ length: SPAN + 1 }, (_, i) => start + i * HOUR).filter((t) => Number(formatHour(t).replace(/h.*/, '')) % 3 === 0));
	const anchor = (px: number) => (px < 36 ? 'start' : px > W - 36 ? 'end' : 'middle');
	const meters = (value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m`;
	const pillText = $derived(direction ? `agora · ${direction === 'enchendo' ? '↑' : '↓'} ${direction}` : 'agora');
	const pillWidth = $derived(pillText.length * 6.9 + 18);
	const pillX = $derived(Math.min(W - PAD - pillWidth, Math.max(PAD, x(now) - 26)));
	const visibleTicks = $derived(ticks.filter((t) => x(t) < pillX - 22 || x(t) > pillX + pillWidth + 22));

	const label = $derived(
		`${rainTotal >= 0.5 ? `Chuva prevista: ${Math.round(rainTotal)} milímetros nas próximas horas.` : 'Sem chuva prevista.'}` +
			(showTide && nowHeight !== null ? ` Maré ${direction ?? ''} em ${meters(nowHeight)} agora.` : '') +
			extremes.map((e) => ` Maré ${e.high ? 'cheia' : 'vazia'} às ${formatHour(e.at)}, ${meters(e.height)}.`).join('')
	);
</script>

<figure class="flex flex-col gap-2">
	<div class="overflow-hidden rounded-3xl bg-white/80 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)]">
		<svg viewBox="0 0 {W} {H}" class="block h-auto w-full" role="img" aria-label={label}>
			<defs>
				<linearGradient id="sea-{uid}" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0" stop-color="var(--color-sea)" stop-opacity="0.45" />
					<stop offset="1" stop-color="var(--color-sea)" stop-opacity="0.06" />
				</linearGradient>
				<clipPath id="over-{uid}">
					<rect x="0" y="0" width={W} height={threshold} />
				</clipPath>
			</defs>

			{#if window}
				<rect x={Math.max(PAD, x(window.from))} y={RAIN_TOP - 8} width={Math.max(0, Math.min(W - PAD, x(window.to)) - Math.max(PAD, x(window.from)))} height={plotBottom - RAIN_TOP + 8} rx="10" fill="var(--color-danger)" opacity="0.08" />
			{/if}

			{#each ticks as t (t)}
				<line x1={x(t)} x2={x(t)} y1={RAIN_TOP - 6} y2={plotBottom} stroke="var(--color-ink)" stroke-width="1" opacity="0.07" />
			{/each}

			<line x1={PAD} x2={W - PAD} y1={RAIN_BASE} y2={RAIN_BASE} stroke="var(--color-rain)" stroke-width="1.5" opacity="0.35" />
			{#if !hasBars}
				<text x={W / 2} y={(RAIN_TOP + RAIN_BASE) / 2 + 6} text-anchor="middle" font-size="13" font-weight="700" fill="var(--color-ink)" opacity="0.5">sem chuva prevista</text>
			{:else}
				{#each hours as h, i (h.at)}
					{#if h.mm >= 0.3}
						{@const height = rainHeight(h.mm)}
						{@const bw = COL - 8}
						{@const bx = PAD + i * COL + 4}
						<rect x={bx} y={RAIN_BASE - height} width={bw} height={height} rx="4" fill="var(--color-rain)" opacity={h.at < now - HOUR ? 0.35 : 0.55 + Math.min(0.45, h.chance / 180)} />
						{#if h.mm >= 1}
							<text x={bx + bw / 2} y={RAIN_BASE - height - 5} text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--color-rain)">{Math.round(h.mm)}</text>
						{/if}
					{/if}
				{/each}
			{/if}

			{#if showTide && area}
				<path d={area} fill="url(#sea-{uid})" />
				<path d={area} fill="var(--color-sea-deep)" opacity="0.32" clip-path="url(#over-{uid})" />
				<line x1={PAD} x2={W - PAD} y1={threshold} y2={threshold} stroke="var(--color-sea-deep)" stroke-width="1.25" stroke-dasharray="3 4" opacity="0.7" />
				{#if thresholdFree}
					<text x={W - PAD} y={threshold - 5} text-anchor="end" font-size="10.5" font-weight="800" fill="var(--color-sea-deep)" paint-order="stroke" stroke="white" stroke-width="3">{meters(LIMITS.inundacao.highTide)}</text>
				{/if}
				<path d={line} fill="none" stroke="var(--color-sea-deep)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

				{#each extremes as e (e.at)}
					{@const px = x(e.at)}
					{@const py = y(e.height)}
					<circle cx={px} cy={py} r="4.5" fill={e.high ? 'var(--color-sea-deep)' : 'white'} stroke="var(--color-sea-deep)" stroke-width="2.5" />
					<text x={px} y={py - 20} text-anchor={anchor(px)} font-size="11.5" font-weight="800" fill="var(--color-sea-deep)" paint-order="stroke" stroke="white" stroke-width="3">
						{e.high ? 'cheia' : 'vazia'} {formatHour(e.at)}
					</text>
					<text x={px} y={py - 8} text-anchor={anchor(px)} font-size="10.5" font-weight="600" fill="var(--color-sea-deep)" opacity="0.85" paint-order="stroke" stroke="white" stroke-width="3">
						{meters(e.height)}
					</text>
				{/each}
			{/if}

			<line x1={x(now)} x2={x(now)} y1={RAIN_TOP - 6} y2={plotBottom + 6} stroke="var(--color-ink)" stroke-width="2" />

			{#if nowHeight !== null}
				<circle cx={x(now)} cy={y(nowHeight)} r="10" fill="var(--color-ink)" opacity="0.1" />
				<circle cx={x(now)} cy={y(nowHeight)} r="5.5" fill="var(--color-ink)" stroke="white" stroke-width="2" />
			{/if}

			<line x1={PAD} x2={W - PAD} y1={plotBottom} y2={plotBottom} stroke="var(--color-ink)" stroke-width="1" opacity="0.18" />
			<rect x={pillX} y={plotBottom + 6} width={pillWidth} height="22" rx="11" fill="var(--color-ink)" />
			<text x={pillX + pillWidth / 2} y={plotBottom + 21.5} text-anchor="middle" font-size="12" font-weight="800" fill="white">{pillText}</text>
			{#each visibleTicks as t (t)}
				<text x={x(t)} y={plotBottom + 22} text-anchor={anchor(x(t))} font-size="12" font-weight="700" fill="var(--color-ink)" opacity="0.7">{formatHour(t)}</text>
			{/each}
		</svg>
	</div>

	<figcaption class="flex flex-wrap gap-x-4 gap-y-1 text-[0.84rem] font-bold">
		<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-[3px] bg-rain"></span>chuva prevista, em mm</span>
		{#if showTide}
			<span class="flex items-center gap-1.5"><span class="h-0.5 w-4 rounded bg-sea-deep"></span>maré</span>
			<span class="flex items-center gap-1.5"><span class="w-4 border-t-2 border-dashed border-sea-deep"></span>acima dela, o canal escoa mal</span>
		{/if}
		{#if window}<span class="flex items-center gap-1.5"><span class="h-3 w-4 rounded-sm bg-danger/25"></span>horas de mais risco</span>{/if}
	</figcaption>
</figure>
