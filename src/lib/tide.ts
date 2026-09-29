import { HOUR } from './time';

export type Extreme = { at: number; height: number; high: boolean };

const API = 'https://esigportal2.recife.pe.gov.br/arcgis/rest/services/COP/BASES_TABELAS_COP_CONSULTA/FeatureServer/4/query';

const stamp = (instant: number) => new Date(instant - 3 * HOUR).toISOString().slice(0, 10);

export function markHighs(points: { at: number; height: number }[]): Extreme[] {
	const sorted = points.slice().sort((a, b) => a.at - b.at);
	return sorted.map((p, i) => {
		const neighbor = sorted[i + 1] ?? sorted[i - 1];
		return { ...p, high: neighbor ? p.height > neighbor.height : p.height > 1.2 };
	});
}

export async function fetchTides(from: number, to: number, signal?: AbortSignal): Promise<Extreme[]> {
	const where = `DATA >= timestamp '${stamp(from - 24 * HOUR)} 00:00:00' AND DATA < timestamp '${stamp(to + 24 * HOUR)} 00:00:00'`;
	const params = new URLSearchParams({ where, outFields: 'MARE,DATAHORA', orderByFields: 'DATAHORA', f: 'json' });
	const response = await fetch(`${API}?${params}`, { signal });
	if (!response.ok) throw new Error(`Maré ${response.status}`);
	const body = (await response.json()) as { features?: { attributes: { MARE: number; DATAHORA: number } }[] };
	if (!body.features) throw new Error('Maré indisponível');
	return markHighs(body.features.map((f) => ({ at: f.attributes.DATAHORA, height: f.attributes.MARE })));
}

export function heightAt(extremes: Extreme[], at: number): number | null {
	const next = extremes.findIndex((e) => e.at >= at);
	if (next <= 0) return null;
	const a = extremes[next - 1]!;
	const b = extremes[next]!;
	const progress = (at - a.at) / (b.at - a.at);
	return a.height + ((b.height - a.height) * (1 - Math.cos(Math.PI * progress))) / 2;
}

export function trend(extremes: Extreme[], at: number): 'enchendo' | 'vazando' | null {
	const next = extremes.find((e) => e.at > at);
	if (!next) return null;
	return next.high ? 'enchendo' : 'vazando';
}

export function nextHigh(extremes: Extreme[], now: number): Extreme | null {
	return extremes.find((e) => e.high && e.at >= now - HOUR) ?? null;
}
