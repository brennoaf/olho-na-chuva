import { fromRecife, HOUR } from './time';

export type Station = {
	code: string;
	name: string;
	lat: number;
	lon: number;
	readAt: number;
	h1: number;
	h3: number;
	h6: number;
	h12: number;
	h24: number;
	h48: number;
	h72: number;
};

type Raw = Record<string, string | number | null>;

const API = 'https://api.apac.pe.gov.br/api.php/precipitacao_acumulada';
export const STALE = 3 * HOUR;

const value = (raw: Raw, key: string) => {
	const v = raw[key];
	return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v * 10) / 10 : null;
};

export function parseStation(raw: Raw): Station | null {
	const keys = ['1_hora', '3_horas', '6_horas', '12_horas', '24_horas', '48_horas', '72_horas'];
	const values = keys.map((k) => value(raw, k));
	if (values.some((v) => v === null) || typeof raw.data_hora_ultima_leitura !== 'string') return null;
	const [h1 = 0, h3 = 0, h6 = 0, h12 = 0, h24 = 0, h48 = 0, h72 = 0] = values as number[];
	return {
		code: String(raw.codigo_estacao),
		name: String(raw.estacao).replace(/^\[[^\]]+\]\s*/, ''),
		lat: Number(raw.latitude),
		lon: Number(raw.longitude),
		readAt: fromRecife(raw.data_hora_ultima_leitura),
		h1,
		h3,
		h6,
		h12,
		h24,
		h48,
		h72
	};
}

export async function fetchStations(cities: string[], signal?: AbortSignal): Promise<Station[]> {
	const lists = await Promise.all(
		cities.map(async (city) => {
			const response = await fetch(`${API}?municipio=${encodeURIComponent(city)}`, { signal });
			if (!response.ok) throw new Error(`APAC ${response.status}`);
			return (await response.json()) as Raw[];
		})
	);
	return lists.flat().flatMap((raw) => parseStation(raw) ?? []);
}

export function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
	const rad = Math.PI / 180;
	const h = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
	return 12742 * Math.asin(Math.sqrt(h));
}

export function nearest(stations: Station[], point: { lat: number; lon: number }, now: number, preferred: string[] = []): { station: Station; km: number } | null {
	const fresh = stations.filter((s) => Number.isFinite(s.readAt) && s.readAt <= now + 60000 && now - s.readAt <= STALE);
	for (const code of preferred) {
		const hit = fresh.find((s) => s.code === code);
		if (hit) return { station: hit, km: km(point, hit) };
	}
	let best: { station: Station; km: number } | null = null;
	for (const station of fresh) {
		const d = km(point, station);
		if (d <= 8 && (!best || d < best.km)) best = { station, km: d };
	}
	return best;
}
