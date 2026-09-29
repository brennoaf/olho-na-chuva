import type { Level } from './alerts';
import { sum, type Hour } from './forecast';
import type { Station } from './rain';
import { heightAt, type Extreme } from './tide';
import { formatHour, HOUR } from './time';

export type Hazard = 'inundacao' | 'deslizamento';
export type Risk = 0 | 1 | 2 | 3;

export const RISK = [
	{ key: 'tranquilo', label: 'Tranquilo' },
	{ key: 'atencao', label: 'Atenção' },
	{ key: 'alerta', label: 'Alerta' },
	{ key: 'perigo', label: 'Perigo' }
] as const;

export const LIMITS = {
	inundacao: {
		perigo: { h24: 60, h1: 30, h3WithTide: 25 },
		alerta: { h24: 40, h3: 20, f6: 30, f3WithTide: 15 },
		atencao: { h24: 15, f12: 15, hourly: 5 },
		highTide: 2.0
	},
	deslizamento: {
		perigo: { h72: 100, h24: 60 },
		alerta: { h72: 60, h24: 40, h72WithForecast: 40, f12: 20 },
		atencao: { h72: 30, h24: 15, f12: 15 }
	}
} as const;

export type Inputs = {
	hazard: Hazard;
	now: number;
	station: Station | null;
	forecast: Hour[];
	tides: Extreme[];
	official: Level | null;
};

export type Reason = { risk: Risk; text: string };
export type Assessment = { risk: Risk; reasons: Reason[]; window: { from: number; to: number } | null; blind: boolean };

const OFFICIAL: Record<Level, Risk> = { amarelo: 1, laranja: 2, vermelho: 3 };

function highTideNear(tides: Extreme[], from: number, to: number, min: number): Extreme | null {
	return tides.find((t) => t.high && t.height >= min && t.at >= from && t.at <= to) ?? null;
}

export function assess({ hazard, now, station, forecast, tides, official }: Inputs): Assessment {
	const reasons: Reason[] = [];
	const add = (risk: Risk, text: string) => reasons.push({ risk, text });
	const f3 = sum(forecast, now, now + 3 * HOUR);
	const f6 = sum(forecast, now, now + 6 * HOUR);
	const f12 = sum(forecast, now, now + 12 * HOUR);
	const peak = forecast.filter((h) => h.at >= now && h.at < now + 12 * HOUR).reduce((m, h) => Math.max(m, h.mm), 0);
	const mm = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mm`;

	if (official) add(OFFICIAL[official], `Aviso oficial ${official} de chuva para a região`);

	if (hazard === 'inundacao') {
		const L = LIMITS.inundacao;
		const tideNow = highTideNear(tides, now - 2 * HOUR, now + 2 * HOUR, L.highTide);
		const tideSoon = highTideNear(tides, now, now + 3 * HOUR, L.highTide);
		if (station) {
			const s = station;
			if (s.h24 >= L.perigo.h24) add(3, `Choveu ${mm(s.h24)} em 24 horas. Foi assim nos dias em que o canal transbordou.`);
			else if (s.h24 >= L.alerta.h24) add(2, `Choveu ${mm(s.h24)} em 24 horas`);
			else if (s.h24 >= L.atencao.h24) add(1, `Choveu ${mm(s.h24)} em 24 horas`);
			if (s.h1 >= L.perigo.h1) add(3, `Chuva muito forte: ${mm(s.h1)} na última hora`);
			if (tideNow && s.h3 >= L.perigo.h3WithTide) add(3, `${mm(s.h3)} em 3 horas com maré alta de ${tideNow.height} m às ${formatHour(tideNow.at)}: a água do canal não tem para onde escoar`);
			else if (s.h3 >= L.alerta.h3) add(2, `Choveu ${mm(s.h3)} nas últimas 3 horas`);
		}
		if (f6 >= L.alerta.f6) add(2, `Previsão de ${mm(f6)} nas próximas 6 horas`);
		if (tideSoon && f3 >= L.alerta.f3WithTide) add(2, `Chuva prevista (${mm(f3)}) perto da maré alta das ${formatHour(tideSoon.at)}`);
		if (f12 >= L.atencao.f12) add(1, `Previsão de ${mm(f12)} nas próximas 12 horas`);
		else if (peak >= L.atencao.hourly) add(1, `Pancada de chuva prevista para as próximas horas`);
	} else {
		const L = LIMITS.deslizamento;
		if (station) {
			const s = station;
			if (s.h72 >= L.perigo.h72) add(3, `Choveu ${mm(s.h72)} em 3 dias. O barro fica encharcado e a barreira pode descer.`);
			else if (s.h72 >= L.alerta.h72) add(2, `Choveu ${mm(s.h72)} em 3 dias`);
			else if (s.h72 >= L.alerta.h72WithForecast && f12 >= L.alerta.f12) add(2, `${mm(s.h72)} em 3 dias e mais ${mm(f12)} previstos`);
			else if (s.h72 >= L.atencao.h72) add(1, `Choveu ${mm(s.h72)} em 3 dias`);
			if (s.h24 >= L.perigo.h24) add(3, `Choveu ${mm(s.h24)} em 24 horas`);
			else if (s.h24 >= L.alerta.h24) add(2, `Choveu ${mm(s.h24)} em 24 horas`);
			else if (s.h24 >= L.atencao.h24) add(1, `Choveu ${mm(s.h24)} em 24 horas`);
		}
		if (f12 >= L.atencao.f12) add(1, `Previsão de ${mm(f12)} nas próximas 12 horas`);
	}

	reasons.sort((a, b) => b.risk - a.risk);
	const risk = (reasons[0]?.risk ?? 0) as Risk;
	return { risk, reasons, window: dangerWindow(hazard, now, forecast, tides), blind: station === null };
}

export function dangerWindow(hazard: Hazard, now: number, forecast: Hour[], tides: Extreme[]): { from: number; to: number } | null {
	const hours = forecast.filter((h) => h.at >= now - HOUR && h.at < now + 12 * HOUR);
	const risky = hours.filter((h) => {
		if (h.mm < 3) return false;
		if (hazard === 'deslizamento') return h.mm >= 5;
		const tide = heightAt(tides, h.at + HOUR / 2);
		return h.mm >= 8 || (tide !== null && tide >= LIMITS.inundacao.highTide - 0.4);
	});
	if (risky.length === 0) return null;
	return { from: risky[0]!.at, to: risky.at(-1)!.at + HOUR };
}
