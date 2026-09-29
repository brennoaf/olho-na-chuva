export const MINUTE = 60000;
export const HOUR = 60 * MINUTE;
export const RECIFE_OFFSET = 3 * HOUR;

const zone = 'America/Recife';
const hourFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, day: '2-digit', month: '2-digit' });
const weekdayFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, weekday: 'long' });
const isoFmt = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });

export function fromRecife(text: string): number {
	const [date, time = '00:00:00'] = text.trim().split(/[ T]/);
	const [y, m, d] = (date ?? '').split('-').map(Number);
	const [hh, mm, ss] = time.split(':').map(Number);
	return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, ss ?? 0) + RECIFE_OFFSET;
}

export function formatHour(instant: number): string {
	const [h, m] = hourFmt.format(instant).split(':');
	return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

export const formatDay = (instant: number) => dayFmt.format(instant);
export const isoDay = (instant: number) => isoFmt.format(instant);

export function relativeDay(instant: number, now: number): string {
	const diff = Math.round((Date.parse(isoDay(instant)) - Date.parse(isoDay(now))) / (24 * HOUR));
	if (diff === 0) return 'hoje';
	if (diff === 1) return 'amanhã';
	if (diff === -1) return 'ontem';
	return weekdayFmt.format(instant);
}

export function formatAgo(instant: number, now: number): string {
	const minutes = Math.max(0, Math.round((now - instant) / MINUTE));
	if (minutes < 2) return 'agora';
	if (minutes < 60) return `há ${minutes} min`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `há ${hours} h`;
	return `em ${formatDay(instant)}`;
}
