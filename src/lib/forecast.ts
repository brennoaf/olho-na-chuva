export type Hour = { at: number; mm: number; chance: number };

export async function fetchForecast(point: { lat: number; lon: number }, signal?: AbortSignal): Promise<Hour[]> {
	const params = new URLSearchParams({
		latitude: point.lat.toFixed(3),
		longitude: point.lon.toFixed(3),
		hourly: 'precipitation,precipitation_probability',
		timeformat: 'unixtime',
		forecast_days: '2',
		past_hours: '3'
	});
	const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
	if (!response.ok) throw new Error(`Previsão ${response.status}`);
	const body = (await response.json()) as { hourly: { time: number[]; precipitation: (number | null)[]; precipitation_probability: (number | null)[] } };
	return body.hourly.time.map((t, i) => ({ at: t * 1000, mm: body.hourly.precipitation[i] ?? 0, chance: body.hourly.precipitation_probability[i] ?? 0 }));
}

export function sum(hours: Hour[], from: number, to: number): number {
	return Math.round(hours.filter((h) => h.at >= from && h.at < to).reduce((n, h) => n + h.mm, 0) * 10) / 10;
}
