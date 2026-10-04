export type Hour = { at: number; mm: number; chance: number | null; weatherCode?: number | null; cloudCover?: number | null; isDay?: number | null };

export function coversForecast(hours: Hour[], now: number, span = 12 * 3600000): boolean {
	let through = now;
	for (const h of hours.slice().sort((a, b) => a.at - b.at)) {
		if (!Number.isFinite(h.mm) || h.mm < 0 || h.at + 3600000 <= through) continue;
		if (h.at > through + 1000) return false;
		through = h.at + 3600000;
		if (through >= now + span - 1000) return true;
	}
	return false;
}

export function forecastSky(hours: Hour[], now: number): string {
	const hour = hours.find(h => h.at <= now && now < h.at + 3600000);
	if (!hour || (hour.isDay !== 0 && hour.isDay !== 1) || hour.weatherCode == null) return 'unknown';
	const code = hour.weatherCode;
	const wet = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
	const cloudy = code >= 3 || (hour.cloudCover ?? 0) >= 65;
	return `${hour.isDay ? 'day' : 'night'}-${wet ? 'rain' : cloudy ? 'cloudy' : 'clear'}`;
}

export async function fetchForecast(point: { lat: number; lon: number }, signal?: AbortSignal): Promise<Hour[]> {
	const params = new URLSearchParams({
		latitude: point.lat.toFixed(3),
		longitude: point.lon.toFixed(3),
		hourly: 'precipitation,precipitation_probability,weather_code,cloud_cover,is_day',
		timeformat: 'unixtime',
		forecast_days: '2',
		past_hours: '3'
	});
	const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
	if (!response.ok) throw new Error(`Previsão ${response.status}`);
	const body = (await response.json()) as { hourly: { time: number[]; precipitation: (number | null)[]; precipitation_probability: (number | null)[]; weather_code?: (number | null)[]; cloud_cover?: (number | null)[]; is_day?: (number | null)[] } };
	return body.hourly.time.flatMap((t, i) => {
		const mm = body.hourly.precipitation[i];
		if (!Number.isFinite(t) || typeof mm !== 'number' || !Number.isFinite(mm) || mm < 0) return [];
		return [{ at: t * 1000, mm, chance: body.hourly.precipitation_probability[i] ?? null, weatherCode: body.hourly.weather_code?.[i] ?? null, cloudCover: body.hourly.cloud_cover?.[i] ?? null, isDay: body.hourly.is_day?.[i] ?? null }];
	});
}

export function sum(hours: Hour[], from: number, to: number): number {
	return Math.round(hours.filter((h) => h.at >= from && h.at < to).reduce((n, h) => n + h.mm, 0) * 10) / 10;
}
