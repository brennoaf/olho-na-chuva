export type Level = 'amarelo' | 'laranja' | 'vermelho';
export type Alert = { source: 'APAC' | 'INMET'; level: Level; title: string; text: string; until: number | null; url: string | null };

const LEVELS: Record<string, Level> = {
	AMARELO: 'amarelo',
	LARANJA: 'laranja',
	VERMELHO: 'vermelho',
	'Perigo Potencial': 'amarelo',
	Perigo: 'laranja',
	'Grande Perigo': 'vermelho'
};
const RAIN = /CHUVA|PRECIPITA|TEMPESTADE|ACUMULADO/i;

type ApacRaw = { tipo: string; nivel_aviso: string; texto_aviso: string; data_validade_aviso: string; url_aviso: string | null; regioes_afetadas?: { nome: string }[] };
type InmetRaw = { descricao: string; severidade: string; geocodes: string; riscos?: string[]; data_fim: string; hora_fim: string };

export async function fetchApacAlerts(signal?: AbortSignal): Promise<Alert[]> {
	const response = await fetch('https://api.apac.pe.gov.br/api.php/alertas', { signal });
	if (!response.ok) throw new Error(`APAC avisos ${response.status}`);
	const list = (await response.json()) as ApacRaw[];
	const now = Date.now();
	return list
		.filter((a) => RAIN.test(`${a.tipo} ${a.texto_aviso}`) && (a.regioes_afetadas ?? []).some((r) => /METROPOLITANA|RECIFE|OLINDA|LITORAL/i.test(r.nome)))
		.map((a) => {
			const until = Date.parse(`${a.data_validade_aviso.replace(' ', 'T')}-03:00`);
			return {
				source: 'APAC' as const,
				level: LEVELS[a.nivel_aviso.toUpperCase()] ?? 'amarelo',
				title: `Aviso de ${a.tipo.toLowerCase()} da APAC`,
				text: a.texto_aviso,
				until: Number.isFinite(until) ? until : null,
				url: a.url_aviso
			};
		})
		.filter((a) => a.until === null || a.until > now);
}

export async function fetchInmetAlerts(ibge: string, signal?: AbortSignal): Promise<Alert[]> {
	const response = await fetch('https://apiprevmet3.inmet.gov.br/avisos/ativos', { signal });
	if (!response.ok) throw new Error(`INMET avisos ${response.status}`);
	const body = (await response.json()) as { hoje?: InmetRaw[]; futuro?: InmetRaw[] };
	return [...(body.hoje ?? []), ...(body.futuro ?? [])]
		.filter((a) => a.geocodes.split(',').map((g) => g.trim()).includes(ibge) && RAIN.test(a.descricao))
		.map((a) => {
			const until = Date.parse(`${a.data_fim.slice(0, 10)}T${a.hora_fim}:00-03:00`);
			return {
				source: 'INMET' as const,
				level: LEVELS[a.severidade] ?? 'amarelo',
				title: `${a.descricao} (INMET)`,
				text: (a.riscos ?? []).join(' '),
				until: Number.isFinite(until) ? until : null,
				url: 'https://alertas2.inmet.gov.br'
			};
		});
}

export function worst(alerts: Alert[]): Level | null {
	if (alerts.some((a) => a.level === 'vermelho')) return 'vermelho';
	if (alerts.some((a) => a.level === 'laranja')) return 'laranja';
	return alerts.length ? 'amarelo' : null;
}
