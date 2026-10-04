<script lang="ts">
	import { area as d3area, curveMonotoneX, line as d3line } from 'd3-shape';
	import { coversForecast, type Hour } from '$lib/forecast';
	import { LIMITS, type Hazard } from '$lib/risk';
	import { heightAt, type Extreme } from '$lib/tide';
	import { formatHour, HOUR } from '$lib/time';

	let { forecast, tides, now, hazard, window }: { forecast: Hour[]; tides: Extreme[]; now: number; hazard: Hazard; window: { from: number; to: number } | null } = $props();

	const W = 360;
	const SPAN = 13;
	const uid = $props.id();

	const RAIN_TOP = 22;
	const RAIN_BASE = 78;
	const TIDE_TOP = 112;
	const TIDE_BASE = 196;

	const showTide = $derived(hazard === 'inundacao' && tides.length > 0);
	const bottom = $derived(showTide ? TIDE_BASE : RAIN_BASE);
	const H = $derived(bottom + 26);

	const start = $derived(Math.floor(now / HOUR) * HOUR - HOUR);
	const end = $derived(start + SPAN * HOUR);
	const x = (t: number) => ((t - start) / (end - start)) * W;
	const col = W / SPAN;

	const hours = $derived(Array.from({ length: SPAN }, (_, i) => forecast.find((h) => h.at === start + i * HOUR) ?? { at: start + i * HOUR, mm: 0, chance: 0 }));
	const hasRain = $derived(hours.some((h) => h.mm >= 0.3));
	const complete = $derived(coversForecast(forecast,now));
	const bar = (mm: number) => Math.max(4, Math.min(RAIN_BASE - RAIN_TOP - 12, mm * 4));

	const top = $derived(Math.max(2.6, ...tides.filter((t) => t.at >= start - 6 * HOUR && t.at <= end + 6 * HOUR).map((t) => t.height + 0.2)));
	const y = (height: number) => TIDE_BASE - (height / top) * (TIDE_BASE - TIDE_TOP);
	const limit = $derived(y(LIMITS.inundacao.highTide));

	const samples = $derived.by(() => {
		if (!showTide) return [] as [number, number][];
		const list: [number, number][] = [];
		for (let i = 0; i <= SPAN * 4; i++) {
			const t = start + (i / 4) * HOUR;
			const h = heightAt(tides, t);
			if (h !== null) list.push([x(t), y(h)]);
		}
		return list;
	});

	const tideLine = $derived(d3line().curve(curveMonotoneX)(samples) ?? '');
	const tideArea = $derived(
		d3area()
			.curve(curveMonotoneX)
			.y0(TIDE_BASE)
			.y1((p) => p[1])(samples) ?? ''
	);

	const marks = $derived(tides.filter((t) => t.at >= now + HOUR / 3 && t.at <= end - HOUR / 2));
	const nowHeight = $derived(showTide ? heightAt(tides, now) : null);
	const ticks = $derived(Array.from({ length: SPAN + 1 }, (_, i) => start + i * HOUR).filter((t) => Number(formatHour(t).replace(/h.*/, '')) % 3 === 0));
	const anchor = (px: number) => (px > W - 40 ? 'end' : 'start');
	const labelled = $derived(ticks.filter((t) => x(t) < x(now) - 34 || x(t) > x(now) + 58));
	const meters = (value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m`;

	const summary = $derived(
		[
			!complete ? 'Previsão incompleta. Lacunas não significam ausência de chuva.' : hasRain ? `Chuva prevista, mais forte às ${formatHour(hours.reduce((a, b) => (b.mm > a.mm ? b : a)).at)}.` : 'Menos de 0,3 mm por hora nos dados exibidos.',
			...marks.map((m) => `Maré ${m.high ? 'cheia' : 'baixa'} às ${formatHour(m.at)}, ${meters(m.height)}.`)
		].join(' ')
	);
</script>

<figure class="flex flex-col gap-3">
	<svg viewBox="0 0 {W} {H}" class="block h-auto w-full overflow-visible" role="img" aria-label={summary}>
		<defs>
			<linearGradient id="fill-{uid}" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0" stop-color="var(--ink)" stop-opacity="0.32" />
				<stop offset="1" stop-color="var(--ink)" stop-opacity="0" />
			</linearGradient>
			<clipPath id="high-{uid}">
				<rect x="0" y="0" width={W} height={limit} />
			</clipPath>
		</defs>

		{#if window}
			<rect x={Math.max(0, x(window.from))} y="0" width={Math.max(0, Math.min(W, x(window.to)) - Math.max(0, x(window.from)))} height={bottom} fill="var(--ink)" opacity="0.08" />
		{/if}

		{#each ticks as t (t)}
			<line x1={x(t)} x2={x(t)} y1="0" y2={H - 4} stroke="var(--ink)" stroke-width="1" opacity="0.18" />
		{/each}
		{#each labelled as t (t)}
			<text x={x(t) + (anchor(x(t)) === 'end' ? -5 : 5)} y={H - 6} text-anchor={anchor(x(t))} font-size="12" font-weight="600" fill="var(--ink)" opacity="0.75">{formatHour(t)}</text>
		{/each}

		<text x={W} y="12" text-anchor="end" font-size="11" font-weight="700" fill="var(--ink)" opacity="0.7">chuva, mm</text>
		{#if hasRain}
			{#each hours as h, i (h.at)}
				{#if h.mm >= 0.3}
					{@const height = bar(h.mm)}
					<rect
						x={i * col + col * 0.22}
						y={RAIN_BASE - height}
						width={col * 0.56}
						height={height}
						rx="2"
						fill="var(--ink)"
						opacity={h.at < now - HOUR ? 0.35 : 0.9}
						style="transform-origin: 0 {RAIN_BASE}px; animation: grow 0.5s var(--ease-out-soft) both; animation-delay: {i * 30}ms"
					/>
					{#if h.mm >= 1}
						<text x={i * col + col / 2} y={RAIN_BASE - height - 4} text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--ink)">{Math.round(h.mm)}</text>
					{/if}
				{/if}
			{/each}
		{:else}
			<text x={W / 2} y={(RAIN_TOP + RAIN_BASE) / 2 + 6} text-anchor="middle" font-size="13" font-weight="600" fill="var(--ink)">{complete ? 'menos de 0,3 mm por hora' : 'previsão incompleta'}</text>
		{/if}
		<line x1="0" x2={W} y1={RAIN_BASE} y2={RAIN_BASE} stroke="var(--ink)" stroke-width="1.5" opacity="0.5" />

		{#if showTide && samples.length > 1}
			<text x={W} y={TIDE_TOP - 16} text-anchor="end" font-size="11" font-weight="700" fill="var(--ink)" opacity="0.7">maré, metros</text>
			<path d={tideArea} fill="url(#fill-{uid})" />
			<path d={tideArea} fill="var(--ink)" opacity="0.22" clip-path="url(#high-{uid})" />
			<line x1="0" x2={W} y1={limit} y2={limit} stroke="var(--ink)" stroke-width="1" stroke-dasharray="2 4" opacity="0.6" />
			<path d={tideLine} fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round" pathLength="1" stroke-dasharray="1" style="animation: draw 0.9s var(--ease-out-soft) both" />
			{#each marks as m (m.at)}
				{@const px = x(m.at)}
				{@const py = y(m.height)}
				<circle cx={px} cy={py} r="4" fill={m.high ? 'var(--ink)' : 'var(--bg)'} stroke="var(--ink)" stroke-width="2" />
				<text x={px} y={py - 10} text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)" paint-order="stroke" stroke="var(--bg)" stroke-width="4">
					{formatHour(m.at)}, {meters(m.height)}
				</text>
			{/each}
			<line x1="0" x2={W} y1={TIDE_BASE} y2={TIDE_BASE} stroke="var(--ink)" stroke-width="1.5" opacity="0.5" />
		{/if}

		<line x1={x(now)} x2={x(now)} y1="2" y2={H - 4} stroke="var(--ink)" stroke-width="3.5" stroke-linecap="round" />
		<text x={x(now) + 7} y={H - 6} font-size="12" font-weight="800" fill="var(--ink)">agora</text>
		{#if nowHeight !== null}
			<circle cx={x(now)} cy={y(nowHeight)} r="6" fill="var(--bg)" stroke="var(--ink)" stroke-width="3" />
		{/if}
	</svg>

	{#if !complete}<p class="text-[0.88rem]">Faltam horas da previsão. Espaços sem barras não confirmam ausência de chuva.</p>{/if}
	{#if showTide}
		<p class="flex items-center gap-2 text-[0.88rem] font-semibold opacity-80">
			<svg viewBox="0 0 24 6" class="h-1.5 w-6 shrink-0" aria-hidden="true"><line x1="0" x2="24" y1="3" y2="3" stroke="currentColor" stroke-width="2" stroke-dasharray="2 4" /></svg>
			A linha pontilhada marca 2 m na previsão de maré. Ela não mede o nível do canal.
		</p>
	{/if}
</figure>
