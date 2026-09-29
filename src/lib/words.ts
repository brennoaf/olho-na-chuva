import type { Area } from './areas';
import type { Hour } from './forecast';
import type { Station } from './rain';
import type { Assessment, Hazard, Risk } from './risk';
import { nextHigh, type Extreme } from './tide';
import { formatHour, HOUR, relativeDay } from './time';

export const WORD: Record<Risk, string> = { 0: 'Tranquilo', 1: 'Atenção', 2: 'Alerta', 3: 'Perigo' };

const SENTENCE: Record<Hazard, Record<Risk, string>> = {
	inundacao: {
		0: 'Sem chuva forte agora nem nas próximas horas.',
		1: 'Pode chover forte. Fique de olho no canal.',
		2: 'O canal pode transbordar. Tire do chão o que puder molhar.',
		3: 'O canal pode transbordar a qualquer momento. Se a água subir, saia de casa.'
	},
	deslizamento: {
		0: 'Sem chuva forte agora nem nas próximas horas.',
		1: 'A terra está ficando molhada. Observe rachaduras e água barrenta descendo.',
		2: 'Muita chuva nos últimos dias. Se a barreira rachar ou uma árvore entortar, saia de casa.',
		3: 'Risco de a barreira descer. Se mora perto dela, saia de casa e procure um lugar seguro.'
	}
};

export const period = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);

export const sentence = (hazard: Hazard, risk: Risk) => SENTENCE[hazard][risk];

export function rainNow(station: Station | null): string {
	if (!station) return 'sem pluviômetro funcionando por perto';
	if (station.h1 >= 20) return 'chuva muito forte agora';
	if (station.h1 >= 5) return 'chuva forte agora';
	if (station.h1 > 0) return 'chuva fraca agora';
	return 'sem chuva agora';
}

export function tideWords(tides: Extreme[], now: number): string {
	const high = nextHigh(tides, now);
	if (!high) return 'tábua de maré indisponível';
	const when = high.at <= now + HOUR / 2 && high.at >= now - HOUR ? 'cheia agora' : `cheia ${relativeDay(high.at, now) === 'hoje' ? '' : `${relativeDay(high.at, now)} `}às ${formatHour(high.at)}`;
	return `maré ${when} (${high.height.toLocaleString('pt-BR')} m)`;
}

export function peakWords(forecast: Hour[], now: number): string {
	const next = forecast.filter((h) => h.at >= now - HOUR && h.at < now + 12 * HOUR);
	const peak = next.reduce<Hour | null>((best, h) => (!best || h.mm > best.mm ? h : best), null);
	if (!peak || peak.mm < 1) return 'sem chuva prevista nas próximas 12 horas';
	const strength = peak.mm >= 8 ? 'forte' : peak.mm >= 3 ? 'moderada' : 'fraca';
	return `chuva ${strength} prevista às ${formatHour(peak.at)}`;
}

export function spoken(area: Area, a: Assessment, station: Station | null, tides: Extreme[], forecast: Hour[], now: number): string {
	return [
		`${area.name}: ${WORD[a.risk]}.`,
		sentence(area.hazard, a.risk),
		a.reasons[0] ? period(a.reasons[0].text) : '',
		`Agora, ${rainNow(station)}.`,
		area.hazard === 'inundacao' ? `${tideWords(tides, now)}.` : '',
		`${peakWords(forecast, now)}.`
	]
		.filter(Boolean)
		.join(' ');
}

export function neighborMessage(area: Area, a: Assessment, station: Station | null, tides: Extreme[], forecast: Hour[], now: number): string {
	const icon = ['🟢', '🟡', '🟠', '🔴'][a.risk];
	return [
		`${icon} *${WORD[a.risk].toUpperCase()}: ${area.name}* (${formatHour(now)})`,
		sentence(area.hazard, a.risk),
		'',
		`• ${rainNow(station)}${station ? `, ${station.h24.toLocaleString('pt-BR')} mm em 24 h` : ''}`,
		area.hazard === 'inundacao' ? `• ${tideWords(tides, now)}` : '',
		`• ${peakWords(forecast, now)}`,
		'',
		'Defesa Civil de Olinda: 0800 081 0060',
		`Acompanhe: ${location.origin}`
	]
		.filter((line, i, all) => line !== '' || all[i - 1] !== '')
		.join('\n');
}
