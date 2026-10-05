import type { Area } from './areas';
import { coversForecast, type Hour } from './forecast';
import type { Station } from './rain';
import type { Assessment, Hazard, Risk } from './risk';
import { nextHigh, type Extreme } from './tide';
import { formatHour, HOUR, relativeDay } from './time';

export function levelName(_hazard: Hazard, risk: Risk, station: Station | null = null): string {
 if (risk === 0) return !station ? 'Sem medição recente' : station.h1 === 0 ? 'Sem chuva medida' : 'Chuva registrada';
 return ['','Atenção à chuva', 'Prepare-se', 'Proteja-se'][risk]!;
}

export type DataQuality = { stale: boolean; incomplete: boolean };
export function advice(hazard: Hazard, a: Assessment, quality: DataQuality = {stale:false,incomplete:false}, station: Station | null = null) {
 const limited = quality.stale || quality.incomplete;
 const unavailable = (limited || !station) && a.risk === 0;
 const notice = quality.stale && quality.incomplete ? 'Dados desatualizados e incompletos.' : quality.stale ? 'Dados desatualizados.' : quality.incomplete ? 'Dados incompletos.' : '';
 const instruction = unavailable ? 'Não foi possível avaliar a situação atual.' : [
  station ? `${station.h1 === 0 ? 'Nenhuma chuva registrada na última hora' : `${station.h1.toLocaleString('pt-BR')} mm de chuva na última hora`}. Leitura das ${formatHour(station.readAt)}.` : 'Medição de chuva indisponível.',
  hazard === 'inundacao' ? 'Mantenha distância de canais e áreas alagadas.' : 'Fique atento a rachaduras novas e sinais de terra se movendo.',
  'Separe documentos e remédios.',
  hazard === 'inundacao' ? 'Não atravesse áreas alagadas. Siga a Defesa Civil.' : 'Se notar rachaduras novas ou terra se movendo, saia para um local seguro.'
 ][a.risk]!;
 const protection = hazard === 'inundacao'
  ? 'Se a água subir, procure um local alto sem atravessar áreas alagadas. Se não conseguir sair com segurança, peça socorro pelo 193.'
  : 'Rachaduras novas, árvores inclinadas ou terra se movendo são sinais para sair imediatamente para um local seguro e avisar a Defesa Civil. Não espere o nível da tela mudar.';
 return {
  title: unavailable ? quality.stale ? 'Dados desatualizados' : 'Dados incompletos' : levelName(hazard,a.risk,station),
  instruction, notice,
  reason: a.reasons[0]?.summary ?? a.reasons[0]?.text ?? '',
  detail: `${unavailable ? 'Faltam dados para avaliar a área.' : a.risk === 0 ? 'Nenhum critério de atenção foi atingido nos dados disponíveis. Isso não garante ausência de risco.' : 'O nível combina chuva, previsão e avisos regionais. Não confirma uma ocorrência na sua rua.'} ${protection}`
 };
}

export const period = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);
export function rainNow(station: Station | null): string {
	if (!station) return 'medição de chuva indisponível';
	return `${station.h1.toLocaleString('pt-BR')} mm de chuva na última hora medida em ${station.name}`;
}

export function tideWords(tides: Extreme[], now: number): string {
	const high = nextHigh(tides, now);
	if (!high) return 'tábua de maré indisponível';
	return `maré alta prevista ${relativeDay(high.at,now)} às ${formatHour(high.at)} (${high.height.toLocaleString('pt-BR')} m)`;
}

export function peakWords(forecast: Hour[], now: number): string {
	const next = forecast.filter((h) => h.at >= now - HOUR && h.at < now + 12 * HOUR);
	const peak = next.reduce<Hour | null>((best, h) => (!best || h.mm > best.mm ? h : best), null);
	if (!peak) return 'previsão indisponível para as próximas horas';
	if (!coversForecast(forecast, now)) return 'previsão incompleta para as próximas 12 horas';
	if (peak.mm < 1) return 'menos de 1 mm por hora previsto nas próximas 12 horas';
	const strength = peak.mm >= 8 ? 'forte' : peak.mm >= 3 ? 'moderada' : 'fraca';
	return `chuva ${strength} prevista às ${formatHour(peak.at)}`;
}

export function spoken(area: Area, a: Assessment, station: Station | null, tides: Extreme[], forecast: Hour[], now: number, quality: DataQuality = {stale:false,incomplete:false}): string {
	const message = advice(area.hazard,a,quality,station);
	return [
		message.notice,
		`${area.name}: ${message.title}.`,
		message.instruction,
		a.reasons[0] ? period(a.reasons[0].text) : '',
		`Medição: ${rainNow(station)}.`,
		area.hazard === 'inundacao' ? `${tideWords(tides, now)}.` : '',
		`${peakWords(forecast, now)}.`
	]
		.filter(Boolean)
		.join(' ');
}

export type ShareStatus = DataQuality & { fetchedAt: number };

const shareNumber = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const shareMoment = (at: number, now: number) => `${relativeDay(at, now)} às ${formatHour(at)}`;
const shareUpdate = (at: number, now: number) => relativeDay(at, now) === 'hoje' ? `às ${formatHour(at)}` : shareMoment(at, now);

export function neighborMessage(area: Area, a: Assessment, station: Station | null, tides: Extreme[], forecast: Hour[], now: number, status: ShareStatus): string {
 const limited = status.stale || status.incomplete;
 const message = advice(area.hazard,a,status,station);
 const upcoming = forecast.filter(h => h.at >= now && h.at < now + 12 * HOUR);
 const peak = upcoming.reduce<Hour | null>((best, h) => !best || h.mm > best.mm ? h : best, null);
 const high = tides.find(t => t.high && t.at >= now);
 const rain = station
  ? station.h1 === 0
   ? `sem chuva medida, leitura das ${formatHour(station.readAt)}`
   : `${shareNumber(station.h1)} mm na última hora, leitura das ${formatHour(station.readAt)}`
  : 'medição indisponível';
 const prediction = !coversForecast(forecast,now)
  ? 'previsão incompleta'
 : !peak
   ? 'previsão indisponível'
   : peak.mm < 1
    ? 'pouca chuva prevista'
    : `chuva ${peak.mm >= 8 ? 'forte' : peak.mm >= 3 ? 'moderada' : 'fraca'} prevista ${shareMoment(peak.at, now)}`;
 const current = limited && a.risk === 0 ? 'não foi possível confirmar a situação' : message.title.toLocaleLowerCase('pt-BR');
 const currentDetail = a.risk === 0 && !limited && station ? rain : current;
 const statusIcon = a.risk === 3 ? '🚨' : a.risk > 0 || limited ? '⚠️' : '✅';
 const header = [`🌧️ *Olho na Chuva*`, `📍 ${area.name}`].join('\n');
 const situation = [
  `${statusIcon} *Agora:* ${currentDetail}.`,
  a.risk > 0 && message.notice ? message.notice : '',
  a.risk > 0 ? message.instruction : '',
  a.risk > 0 || limited ? `🌧️ *Chuva medida:* ${rain}.` : ''
 ].filter(Boolean).join('\n');
 const outlook = [
  `☔ *Próximas 12h:* ${prediction}.`,
  area.hazard === 'inundacao' ? high ? `🌊 *Maré alta:* ${shareNumber(high.height)} m ${shareMoment(high.at, now)}.` : '🌊 *Maré:* previsão indisponível.' : ''
 ].filter(Boolean).join('\n');
 const footer = [
  `🕒 ${status.stale ? 'Dados salvos' : 'Atualizado'} ${shareUpdate(status.fetchedAt, now)}.`,
  a.risk >= 2 ? '📞 *Defesa Civil:* 0800 081 0060.' : ''
 ].filter(Boolean).join('\n');
 return [header, situation, outlook, footer].filter(Boolean).join('\n\n');
}
export type Row = { label: string; detail: string; value: string };

const decimal = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const distance = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${decimal(km)} km`);

export function rows(
	area: Area,
	station: { station: Station; km: number } | null,
	tides: Extreme[],
	forecast: Hour[],
	official: 'amarelo' | 'laranja' | 'vermelho' | null,
	now: number,
	ago: (instant: number) => string
): { list: Row[]; source: string } {
	const list: Row[] = [];
	const s = station?.station ?? null;
	const source = station ? `pluviômetro ${station.station.name.toLowerCase()}, a ${distance(station.km)}, ${ago(station.station.readAt)}` : 'nenhum pluviômetro funcionando por perto';

	list.push({
		label: 'chuva medida',
		detail: s ? `1h até ${formatHour(s.readAt)}` : 'sem leitura',
		value: !s ? 'sem dado' : `${decimal(s.h1)} mm`
	});

	if (area.hazard === 'deslizamento') {
		list.push({
			label: 'últimos 3 dias',
			detail: s ? `${decimal(s.h72)} mm` : 'sem leitura',
		value: !s ? 'sem dado' : `${decimal(s.h72)} mm`
		});
	} else {
		list.push({
			label: 'últimas 24 horas',
			detail: s ? `${decimal(s.h24)} mm` : 'sem leitura',
			value: !s ? 'sem dado' : s.h24 >= 60 ? 'demais' : s.h24 >= 40 ? 'muita' : s.h24 >= 15 ? 'moderada' : 'pouca'
		});
		const high = nextHigh(tides, now);
		const next = tides.find((t) => t.at > now);
		list.push({
			label: 'maré',
			detail: high ? `cheia ${relativeDay(high.at, now) === 'hoje' ? '' : `${relativeDay(high.at, now)} `}às ${formatHour(high.at)}` : 'tábua indisponível',
			value: !next ? 'sem dado' : next.high ? 'enchendo' : 'vazando'
		});
	}

	const coming = forecast.filter((h) => h.at >= now - HOUR && h.at < now + 12 * HOUR);
	const peak = coming.reduce<Hour | null>((best, h) => (!best || h.mm > best.mm ? h : best), null);
	list.push({
		label: 'previsão',
		detail: !coversForecast(forecast,now) ? 'faltam horas da previsão' : peak && peak.mm >= 1 ? `mais forte às ${formatHour(peak.at)}` : 'menos de 1 mm por hora',
		value: !peak ? 'sem dado' : !coversForecast(forecast,now) ? 'incompleta' : peak.mm < 1 ? 'pouca chuva' : peak.mm >= 8 ? 'forte' : peak.mm >= 3 ? 'moderada' : 'fraca'
	});

	list.push({ label: 'aviso oficial', detail: 'apac e inmet', value: official ?? 'nenhum' });
	return { list, source };
}

export type Moment = { at: number | null; when: string; text: string; icon: 'rain' | 'wave' | 'alert' | 'check' | 'clock'; strong: boolean };

export function moments(hazard: Hazard, station: Station | null, forecast: Hour[], tides: Extreme[], window: { from: number; to: number } | null, now: number): Moment[] {
	const list: Moment[] = [];
	const nowRain = !station ? 'Sem medição de chuva por perto' : `${decimal(station.h1)} mm na última hora medida`;
	list.push({ at: null, when: station ? formatHour(station.readAt) : 'Agora', text: nowRain, icon: station && station.h1 > 0 ? 'rain' : 'check', strong: !!station && station.h1 >= 5 });

	const next = forecast.filter((h) => h.at > now && h.at < now + 12 * HOUR);
	const raining = !!station && station.h1 > 0;
	const first = next.find((h) => h.mm >= 1);
	const peak = next.reduce<Hour | null>((best, h) => (!best || h.mm > best.mm ? h : best), null);
	if (first && !raining) list.push({ at: first.at, when: formatHour(first.at), text: 'Pode começar a chover', icon: 'rain', strong: false });
	const strongNow = !!station && station.h1 >= 5;
	if (peak && peak.mm >= 3 && peak.at !== first?.at && !(strongNow && peak.at - now < 3 * HOUR)) list.push({ at: peak.at, when: formatHour(peak.at), text: peak.mm >= 8 ? 'Chuva forte' : 'Chuva moderada', icon: 'rain', strong: peak.mm >= 8 });

	if (hazard === 'inundacao') {
		for (const t of tides.filter((t) => t.high && t.at > now && t.at < now + 12 * HOUR)) {
			const full = t.height >= 2;
			list.push({ at: t.at, when: formatHour(t.at), text: `Maré alta prevista: ${decimal(t.height)} m`, icon: 'wave', strong: full });
		}
	}

	if (window && window.from > now) list.push({ at: window.from, when: formatHour(window.from), text: `Mais cuidado até as ${formatHour(window.to)}`, icon: 'alert', strong: true });

	const merged: Moment[] = [];
	for (const m of list.slice(1).sort((a, b) => (a.at ?? 0) - (b.at ?? 0))) {
		const same = merged.find((x) => x.when === m.when);
		if (same) {
			same.text = `${same.text}. ${m.text}`;
			same.strong ||= m.strong;
			if (m.icon === 'alert') same.icon = 'alert';
		} else merged.push({ ...m });
	}
	const future = merged.slice(0, 4);
	if (!coversForecast(forecast,now)) future.push({ at:null, when:'Previsão', text:next.length ? 'Faltam horas da previsão. Tente atualizar.' : 'Previsão indisponível. Tente atualizar mais tarde.', icon:'clock', strong:false });
	else if (future.length === 0) future.push({ at: null, when: 'A seguir', text: 'Menos de 1 mm por hora previsto nas próximas 12 horas', icon: 'clock', strong: false });
	return [list[0]!, ...future];
}
