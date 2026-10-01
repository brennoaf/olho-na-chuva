<script lang="ts">
	import type { Hazard, Risk } from '$lib/risk';

	let { hazard, risk, raining, label }: { hazard: Hazard; risk: Risk; raining: boolean; label: string } = $props();

	const W = 360;
	const H = 230;

	const SKY = ['#bfe3f3', '#c9d3da', '#9fadb7', '#77848e'];
	const sky = $derived(SKY[risk]);
	const clouds = $derived(([1, 2, 3, 4] as const)[risk]);
	const drops = $derived(raining || risk > 0 ? [0, 26, 52, 84][Math.max(risk, raining ? 1 : 0)]! : 0);

	const seed = (n: number) => {
		const v = Math.sin(n * 127.1) * 43758.5453;
		return v - Math.floor(v);
	};
	const rain = $derived(Array.from({ length: drops }, (_, i) => ({ x: seed(i + 1) * (W + 40) - 20, y: seed(i + 7) * H, len: 10 + seed(i + 3) * 10 })));

	const HOUSES = [
		{ x: 6, w: 54, h: 66, color: '#f2c230', roof: false },
		{ x: 62, w: 48, h: 78, color: '#2f74c0', roof: true },
		{ x: 112, w: 58, h: 60, color: '#e46f8a', roof: false },
		{ x: 172, w: 50, h: 82, color: '#46a46a', roof: true },
		{ x: 224, w: 56, h: 64, color: '#f08a3c', roof: false },
		{ x: 282, w: 72, h: 74, color: '#f5e7c6', roof: true }
	];

	const STREET = 168;
	const WATER = [214, 202, 186, 158];
	const level = $derived(WATER[risk]!);
	const flooded = $derived(level < STREET);

	const SLOPE_HOUSES = [
		{ x: 40, y: 150, w: 46, h: 40, color: '#f2c230' },
		{ x: 98, y: 120, w: 44, h: 42, color: '#e46f8a' },
		{ x: 150, y: 92, w: 46, h: 40, color: '#2f74c0' },
		{ x: 206, y: 66, w: 42, h: 38, color: '#46a46a' }
	];

	function wave(y: number, amp: number) {
		let d = `M-20,${y}`;
		for (let x = -20; x <= W + 40; x += 20) d += ` Q${x + 10},${y - amp} ${x + 20},${y}`;
		return `${d} L${W + 40},${H} L-20,${H} Z`;
	}
</script>

<svg viewBox="0 0 {W} {H}" class="block h-auto w-full" role="img" aria-label={label}>
	<rect width={W} height={H} fill={sky} style="transition: fill 0.6s" />

	{#if risk === 0 && !raining}
		<circle cx="300" cy="46" r="22" fill="#ffd25a" />
	{/if}

	{#each Array.from({ length: clouds }) as _, i (i)}
		{@const cx = [70, 220, 150, 300][i]!}
		{@const cy = [40, 30, 56, 62][i]!}
		<g fill={risk >= 2 ? '#5f6b74' : risk === 1 ? '#e8edf0' : '#ffffff'} opacity="0.95" style="animation: drift {14 + i * 3}s ease-in-out infinite alternate">
			<ellipse cx={cx} cy={cy} rx="34" ry="14" />
			<ellipse cx={cx - 16} cy={cy - 8} rx="18" ry="14" />
			<ellipse cx={cx + 12} cy={cy - 12} rx="20" ry="16" />
		</g>
	{/each}

	{#if hazard === 'inundacao'}
		{#each HOUSES as house (house.x)}
			{@const top = STREET - house.h}
			<g>
				<rect x={house.x} y={top} width={house.w} height={house.h} fill={house.color} />
				{#if house.roof}
					<path d="M{house.x - 3},{top} L{house.x + house.w / 2},{top - 16} L{house.x + house.w + 3},{top} Z" fill="#b5532f" />
				{:else}
					<rect x={house.x - 2} y={top - 6} width={house.w + 4} height="7" fill="#ffffff" opacity="0.85" />
				{/if}
				<rect x={house.x + house.w / 2 - 7} y={STREET - 26} width="14" height="26" rx="1" fill="#3b2a20" />
				<rect x={house.x + 7} y={top + 12} width="11" height="15" fill="#ffffff" />
				<rect x={house.x + house.w - 18} y={top + 12} width="11" height="15" fill="#ffffff" />
				<rect x={house.x + 8.5} y={top + 13.5} width="8" height="12" fill="#2f5d73" opacity="0.55" />
				<rect x={house.x + house.w - 16.5} y={top + 13.5} width="8" height="12" fill="#2f5d73" opacity="0.55" />
			</g>
		{/each}
		<rect x="0" y={STREET} width={W} height="10" fill="#a39c8c" />
		<rect x="0" y={STREET + 10} width={W} height={H - STREET - 10} fill="#7f7a6c" />
		<rect x="18" y={STREET + 12} width="6" height="46" fill="#ffffff" />
		{#each [0, 1, 2, 3, 4] as mark (mark)}
			<rect x="24" y={STREET + 14 + mark * 9} width="5" height="2" fill="#ffffff" />
		{/each}
		<g style="animation: swell 4s ease-in-out infinite alternate">
			<path d={wave(level, flooded ? 5 : 3)} fill="#2e86ab" opacity={flooded ? 0.88 : 1} style="transition: d 0.8s" />
			<path d={wave(level + 6, 2)} fill="#1f6c8c" opacity="0.5" />
		</g>
	{:else}
		<path d="M0,{H} L0,182 C80,176 150,110 230,64 C270,42 320,34 {W},30 L{W},{H} Z" fill="#7aa35a" />
		<path d="M0,{H} L0,196 C90,190 160,128 240,84 C280,62 330,54 {W},52 L{W},{H} Z" fill="#9b6b43" />
		{#each SLOPE_HOUSES as house (house.x)}
			<rect x={house.x} y={house.y - house.h} width={house.w} height={house.h} fill={house.color} />
			<rect x={house.x - 2} y={house.y - house.h - 5} width={house.w + 4} height="6" fill="#ffffff" opacity="0.85" />
			<rect x={house.x + house.w / 2 - 6} y={house.y - 20} width="12" height="20" fill="#3b2a20" />
			<rect x={house.x + 6} y={house.y - house.h + 10} width="10" height="12" fill="#ffffff" />
		{/each}
		{#if risk >= 2}
			<path d="M120,186 l10,-8 l-4,-7 l12,-9 l-5,-8 l11,-10" fill="none" stroke="#3b2a20" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M250,120 l-8,10 l6,7 l-10,10" fill="none" stroke="#3b2a20" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
		{/if}
		{#if risk === 3}
			<path d="M200,96 C190,130 160,160 150,200 C140,222 110,230 80,{H} L230,{H} C220,200 230,150 236,100 Z" fill="#6b4226" opacity="0.92" />
			<circle cx="170" cy="190" r="7" fill="#57534e" />
			<circle cx="196" cy="214" r="9" fill="#57534e" />
			<circle cx="150" cy="222" r="6" fill="#57534e" />
		{/if}
	{/if}

	{#if drops}
		<g stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity={risk >= 2 ? 0.75 : 0.6} style="animation: rain {risk >= 2 ? 0.55 : 0.9}s linear infinite">
			{#each rain as d, i (i)}
				<line x1={d.x} y1={d.y - H} x2={d.x - 4} y2={d.y - H + d.len} />
				<line x1={d.x} y1={d.y} x2={d.x - 4} y2={d.y + d.len} />
			{/each}
		</g>
	{/if}
</svg>
