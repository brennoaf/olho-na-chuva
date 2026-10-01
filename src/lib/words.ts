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

const HEADLINE: Record<Hazard, Record<Risk, string>> = {
	inundacao: {
		0: 'sem chuva forte agora nem nas próximas horas',
		1: 'pode chover forte, fique de olho no canal',
		2: 'o canal pode transbordar, tire do chão o que puder molhar',
		3: 'o canal pode transbordar a qualquer momento'
	},
	deslizamento: {
		0: 'sem chuva forte agora nem nas próximas horas',
		1: 'a terra está ficando molhada, observe rachaduras',
		2: 'muita chuva nos últimos dias, a barreira pode ceder',
		3: 'a barreira pode descer a qualquer momento'
	}
};

export const headline = (hazard: Hazard, risk: Risk) => HEADLINE[hazard][risk];

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

function greeting(now: number): string {
	const hour = Number(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Recife', hour: '2-digit', hour12: false }).format(now));
	if (hour >= 5 && hour < 12) return 'Bom dia';
	if (hour >= 12 && hour < 18) return 'Boa tarde';
	return 'Boa noite';
}

const mm = (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mm`;

function rainStory(hazard: Area['hazard'], station: Station | null): string {
	if (!station) return '';
	if (hazard === 'deslizamento' && station.h72 >= 1) return `Pelo pluviômetro aqui perto, já choveu ${mm(station.h72)} nos últimos 3 dias, e a terra está pesada.`;
	if (station.h1 >= 5) return `Está chovendo forte agora: ${mm(station.h1)} só na última hora e ${mm(station.h24)} em 24 horas.`;
	if (station.h24 >= 1) return `Pelo pluviômetro aqui perto, choveu ${mm(station.h24)} nas últimas 24 horas.`;
	return 'Não choveu nas últimas horas.';
}

function forecastStory(forecast: Hour[], now: number): string {
	const next = forecast.filter((h) => h.at >= now - HOUR && h.at < now + 12 * HOUR);
	const peak = next.reduce<Hour | null>((best, h) => (!best || h.mm > best.mm ? h : best), null);
	if (!peak || peak.mm < 1) return 'A previsão não mostra chuva forte pras próximas horas.';
	const strength = peak.mm >= 8 ? 'chuva forte' : peak.mm >= 3 ? 'uma boa chuva' : 'chuva fraca';
	return `A previsão é de ${strength} ${around(peak.at)}.`;
}

function around(instant: number): string {
	const hour = formatHour(instant);
	if (hour === '0h') return 'lá pela meia-noite';
	if (hour === '12h') return 'lá pelo meio-dia';
	if (/^1h/.test(hour)) return `lá pela ${hour}`;
	return `lá pelas ${hour}`;
}

function tideStory(tides: Extreme[], now: number): string {
	const high = nextHigh(tides, now);
	if (!high || high.at > now + 12 * HOUR) return '';
	if (high.at <= now + HOUR / 2) return 'A maré está cheia agora, e com maré cheia a água do canal custa a escoar.';
	return `A maré enche às ${formatHour(high.at)}, e com maré cheia a água do canal custa a escoar.`;
}

export function neighborMessage(area: Area, a: Assessment, station: Station | null, tides: Extreme[], forecast: Hour[], now: number, shelter: string): string {
	const hi = greeting(now);
	const place = area.name;
	const rain = rainStory(area.hazard, station);
	const next = forecastStory(forecast, now);
	const tide = area.hazard === 'inundacao' ? tideStory(tides, now) : '';
	const flood = area.hazard === 'inundacao';

	const body: Record<Risk, string[]> = {
		0: [
			`${hi}, vizinhos!`,
			`Passando pra dizer que aqui no ${place} está tudo tranquilo por enquanto. ${rain} ${next}`,
			'Qualquer mudança eu aviso. Fiquem bem!'
		],
		1: [
			`${hi}, vizinhos!`,
			`Só um aviso de cuidado aqui do ${place}. ${next} ${tide}`,
			flood
				? 'Nada de pânico, mas vale deixar documentos e remédios num saco plástico e ficar de olho no canal.'
				: 'Nada de pânico, mas vale observar se aparece rachadura nas paredes ou no chão, ou água barrenta descendo da barreira.',
			'Se alguém precisar de uma mão, é só chamar.'
		],
		2: [
			'Vizinhos, atenção!',
			`${rain} ${tide || next}`,
			flood ? '*O canal pode transbordar.* Vamos tirar do chão o que puder molhar.' : '*A barreira pode ceder.* Quem mora perto dela: se aparecer rachadura, estalo ou árvore entortando, saia de casa na hora.',
			'E vamos dar uma olhada em quem mora sozinho, nos idosos e em quem tem criança pequena. Se precisar de ajuda pra levantar móvel, me chama. Juntos a gente se cuida.'
		],
		3: [
			flood ? 'Gente, é sério: *o canal pode transbordar a qualquer momento.*' : 'Gente, é sério: *a barreira pode descer.*',
			rain,
			flood
				? 'Se a água começar a subir, não esperem: desliguem a energia, peguem documentos e remédios e vão pra um lugar alto.'
				: 'Quem mora perto da encosta, saia de casa agora e vá pra casa de um parente ou pra um abrigo.',
			`O abrigo mais perto é a ${shelter}.`,
			'Quem puder, ajude os vizinhos idosos e acamados a sair. Estou por aqui, qualquer coisa me liguem.',
			'Defesa Civil de Olinda: 0800 081 0060',
			'Bombeiros: 193'
		]
	};

	return [...body[a.risk].map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean), '', `Mandei pelo Olho na Chuva, que junta a chuva medida aqui perto, a previsão e a maré. Dá pra acompanhar aqui: ${location.origin}`].join('\n\n').replace(/\n{3,}/g, '\n\n');
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
		label: 'chuva agora',
		detail: s ? `${decimal(s.h1)} mm na última hora` : 'sem leitura',
		value: !s ? 'sem dado' : s.h1 >= 20 ? 'muito forte' : s.h1 >= 5 ? 'forte' : s.h1 > 0 ? 'fraca' : 'parada'
	});

	if (area.hazard === 'deslizamento') {
		list.push({
			label: 'últimos 3 dias',
			detail: s ? `${decimal(s.h72)} mm` : 'sem leitura',
			value: !s ? 'sem dado' : s.h72 >= 100 ? 'encharcado' : s.h72 >= 60 ? 'muito' : s.h72 >= 30 ? 'molhado' : 'pouco'
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
		detail: peak && peak.mm >= 1 ? `mais forte às ${formatHour(peak.at)}` : 'sem chuva forte',
		value: !peak || peak.mm < 1 ? 'seco' : peak.mm >= 8 ? 'forte' : peak.mm >= 3 ? 'moderada' : 'fraca'
	});

	list.push({ label: 'aviso oficial', detail: 'apac e inmet', value: official ?? 'nenhum' });
	return { list, source };
}
