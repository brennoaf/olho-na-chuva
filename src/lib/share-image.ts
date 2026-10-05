import type { Area } from './areas';
import { coversForecast, type Hour } from './forecast';
import type { Station } from './rain';
import type { Assessment, Risk } from './risk';
import type { Extreme } from './tide';
import { formatHour, HOUR, relativeDay } from './time';
import { advice, type ShareStatus } from './words';

type Theme = { top: string; middle: string; bottom: string; ink: string; muted: string; accent: string };
type Metric = { label: string; value: string; detail: string };

const themes: Record<Risk | 'unknown', Theme> = {
	0: { top: '#8fc2e7', middle: '#d6e9f3', bottom: '#f7f8f5', ink: '#142231', muted: '#425365', accent: '#164d69' },
	1: { top: '#e8c86f', middle: '#f4e3b7', bottom: '#fbf8ee', ink: '#2d2719', muted: '#62583e', accent: '#695119' },
	2: { top: '#e99d70', middle: '#f3c9aa', bottom: '#fbf5ee', ink: '#352116', muted: '#6c4b39', accent: '#7a3418' },
	3: { top: '#ec988e', middle: '#f4c2ba', bottom: '#fcf3f1', ink: '#381d1d', muted: '#704645', accent: '#81221f' },
	unknown: { top: '#bcc9d5', middle: '#dde4e9', bottom: '#f7f8f6', ink: '#202a35', muted: '#56616d', accent: '#455667' }
};

const number = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
	const r = Math.min(radius, width / 2, height / 2);
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + width, y, x + width, y + height, r);
	ctx.arcTo(x + width, y + height, x, y + height, r);
	ctx.arcTo(x, y + height, x, y, r);
	ctx.arcTo(x, y, x + width, y, r);
	ctx.closePath();
}

function glass(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius = 46) {
	ctx.save();
	ctx.shadowColor = 'rgba(31, 55, 72, .16)';
	ctx.shadowBlur = 42;
	ctx.shadowOffsetY = 18;
	rounded(ctx, x, y, width, height, radius);
	const fill = ctx.createLinearGradient(x, y, x + width, y + height);
	fill.addColorStop(0, 'rgba(255,255,255,.70)');
	fill.addColorStop(.52, 'rgba(255,255,255,.38)');
	fill.addColorStop(1, 'rgba(255,255,255,.24)');
	ctx.fillStyle = fill;
	ctx.fill();
	ctx.shadowColor = 'transparent';
	ctx.strokeStyle = 'rgba(255,255,255,.82)';
	ctx.lineWidth = 2;
	ctx.stroke();
	ctx.restore();
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
	ctx.save();
	ctx.strokeStyle = color;
	ctx.lineWidth = 5 * scale;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.beginPath();
	ctx.moveTo(x + 7 * scale, y + 30 * scale);
	ctx.bezierCurveTo(x - 3 * scale, y + 29 * scale, x - 4 * scale, y + 12 * scale, x + 10 * scale, y + 10 * scale);
	ctx.bezierCurveTo(x + 15 * scale, y - 5 * scale, x + 38 * scale, y - 4 * scale, x + 44 * scale, y + 11 * scale);
	ctx.bezierCurveTo(x + 60 * scale, y + 8 * scale, x + 67 * scale, y + 30 * scale, x + 51 * scale, y + 31 * scale);
	ctx.stroke();
	for (const offset of [16, 31, 46]) {
		ctx.beginPath();
		ctx.moveTo(x + offset * scale, y + 41 * scale);
		ctx.lineTo(x + (offset - 3) * scale, y + 52 * scale);
		ctx.stroke();
	}
	ctx.restore();
}

function pin(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
	ctx.save();
	ctx.strokeStyle = color;
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.arc(x, y, 13, Math.PI, 0);
	ctx.bezierCurveTo(x + 13, y + 12, x, y + 27, x, y + 27);
	ctx.bezierCurveTo(x, y + 27, x - 13, y + 12, x - 13, y);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(x, y, 4, 0, Math.PI * 2);
	ctx.stroke();
	ctx.restore();
}

function lines(ctx: CanvasRenderingContext2D, text: string, width: number) {
	const words = text.split(/\s+/);
	const result: string[] = [];
	let line = '';
	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (line && ctx.measureText(next).width > width) {
			result.push(line);
			line = word;
		} else line = next;
	}
	if (line) result.push(line);
	return result;
}

function wrapped(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, size: number, lineHeight: number, maxLines = 3) {
	let fontSize = size;
	let result: string[] = [];
	do {
		ctx.font = `650 ${fontSize}px "Archivo Variable", Arial, sans-serif`;
		result = lines(ctx, text, width);
		if (result.length <= maxLines) break;
		fontSize -= 4;
	} while (fontSize >= 48);
	for (const [index, line] of result.slice(0, maxLines).entries()) ctx.fillText(line, x, y + index * lineHeight);
	return y + Math.min(result.length, maxLines) * lineHeight;
}

function metric(ctx: CanvasRenderingContext2D, item: Metric, x: number, y: number, width: number, theme: Theme) {
	ctx.fillStyle = theme.muted;
	ctx.font = '600 22px "Archivo Variable", Arial, sans-serif';
	ctx.fillText(item.label.toLocaleUpperCase('pt-BR'), x, y);
	ctx.fillStyle = theme.ink;
	ctx.font = '650 50px "Archivo Variable", Arial, sans-serif';
	let fontSize = 50;
	while (ctx.measureText(item.value).width > width && fontSize > 34) {
		fontSize -= 2;
		ctx.font = `650 ${fontSize}px "Archivo Variable", Arial, sans-serif`;
	}
	ctx.fillText(item.value, x, y + 50);
	ctx.fillStyle = theme.muted;
	ctx.font = '450 23px "Archivo Variable", Arial, sans-serif';
	for (const [index, line] of lines(ctx, item.detail, width).slice(0, 2).entries()) ctx.fillText(line, x, y + 120 + index * 31);
}

function toFile(canvas: HTMLCanvasElement, name: string) {
	const data = canvas.toDataURL('image/png').split(',')[1] ?? '';
	const binary = atob(data);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return new File([bytes], name, { type: 'image/png', lastModified: Date.now() });
}

export function createShareImage(area: Area, assessment: Assessment, station: Station | null, tides: Extreme[], forecast: Hour[], now: number, status: ShareStatus) {
	const canvas = document.createElement('canvas');
	canvas.width = 1080;
	canvas.height = 1350;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Imagem indisponível');
	const limited = status.stale || status.incomplete;
	const theme = themes[limited && assessment.risk === 0 ? 'unknown' : assessment.risk];
	const message = advice(area.hazard, assessment, status, station);
	const upcoming = forecast.filter((hour) => hour.at >= now && hour.at < now + 12 * HOUR);
	const peak = upcoming.reduce<Hour | null>((best, hour) => !best || hour.mm > best.mm ? hour : best, null);
	const high = tides.find((tide) => tide.high && tide.at >= now);
	const forecastValue = !coversForecast(forecast, now) ? 'Incompleta' : !peak ? 'Sem dado' : peak.mm < 1 ? 'Pouca' : peak.mm >= 8 ? 'Forte' : peak.mm >= 3 ? 'Moderada' : 'Fraca';
	const forecastDetail = peak && peak.mm >= 1 ? `${relativeDay(peak.at, now)} às ${formatHour(peak.at)}` : 'próximas 12 horas';
	const third: Metric = area.hazard === 'inundacao'
		? { label: 'Maré alta', value: high ? `${number(high.height)} m` : 'Sem dado', detail: high ? `${relativeDay(high.at, now)} às ${formatHour(high.at)}` : 'previsão indisponível' }
		: { label: 'Últimos 3 dias', value: station ? `${number(station.h72)} mm` : 'Sem dado', detail: 'chuva acumulada' };
	const metrics: Metric[] = [
		{ label: 'Chuva agora', value: station ? `${number(station.h1)} mm` : 'Sem dado', detail: station ? `leitura das ${formatHour(station.readAt)}` : 'medição indisponível' },
		{ label: 'Previsão', value: forecastValue, detail: forecastDetail },
		third
	];

	const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
	background.addColorStop(0, theme.top);
	background.addColorStop(.48, theme.middle);
	background.addColorStop(1, theme.bottom);
	ctx.fillStyle = background;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'rgba(255,255,255,.22)';
	ctx.beginPath();
	ctx.moveTo(0, 40);
	ctx.bezierCurveTo(280, 180, 690, -20, 1080, 150);
	ctx.lineTo(1080, 0);
	ctx.lineTo(0, 0);
	ctx.fill();
	ctx.fillStyle = 'rgba(255,255,255,.16)';
	ctx.beginPath();
	ctx.moveTo(0, 1040);
	ctx.bezierCurveTo(330, 900, 680, 1170, 1080, 980);
	ctx.lineTo(1080, 1350);
	ctx.lineTo(0, 1350);
	ctx.fill();

	ctx.textBaseline = 'top';
	cloud(ctx, 70, 66, .8, theme.ink);
	ctx.fillStyle = theme.ink;
	ctx.font = '650 32px "Archivo Variable", Arial, sans-serif';
	ctx.fillText('olho na chuva', 136, 79);
	ctx.textAlign = 'right';
	ctx.fillStyle = theme.muted;
	ctx.font = '500 23px "Archivo Variable", Arial, sans-serif';
	ctx.fillText(`${status.stale ? 'DADOS SALVOS' : 'ATUALIZADO'} ÀS ${formatHour(status.fetchedAt)}`, 1006, 84);
	ctx.textAlign = 'left';

	glass(ctx, 62, 176, 956, 402);
	pin(ctx, 95, 222, theme.accent);
	ctx.fillStyle = theme.accent;
	ctx.font = '600 24px "Archivo Variable", Arial, sans-serif';
	ctx.fillText(area.name.toLocaleUpperCase('pt-BR'), 127, 211);
	ctx.fillStyle = theme.muted;
	ctx.font = '600 22px "Archivo Variable", Arial, sans-serif';
	ctx.fillText('SITUAÇÃO AGORA', 94, 276);
	ctx.fillStyle = theme.ink;
	const title = limited && assessment.risk === 0 ? 'Dados incompletos' : message.title;
	const titleEnd = wrapped(ctx, title, 92, 316, 860, 86, 86, 2);
	const supporting = assessment.risk > 0 || limited ? message.instruction : 'Confira a chuva, a previsão e a maré antes de sair.';
	ctx.fillStyle = theme.muted;
	ctx.font = '450 29px "Archivo Variable", Arial, sans-serif';
	for (const [index, line] of lines(ctx, supporting, 850).slice(0, 2).entries()) ctx.fillText(line, 94, titleEnd + 16 + index * 39);

	glass(ctx, 62, 616, 956, 286);
	const columnWidth = 258;
	for (const [index, item] of metrics.entries()) {
		const x = 98 + index * 310;
		metric(ctx, item, x, 670, columnWidth, theme);
		if (index < 2) {
			ctx.strokeStyle = 'rgba(32,54,69,.16)';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(x + 278, 666);
			ctx.lineTo(x + 278, 848);
			ctx.stroke();
		}
	}

	if (assessment.risk >= 2) {
		glass(ctx, 62, 940, 956, 166, 38);
		ctx.fillStyle = theme.accent;
		ctx.font = '650 26px "Archivo Variable", Arial, sans-serif';
		ctx.fillText('PRECISA DE AJUDA?', 98, 982);
		ctx.fillStyle = theme.ink;
		ctx.font = '600 37px "Archivo Variable", Arial, sans-serif';
		ctx.fillText('Defesa Civil  0800 081 0060', 98, 1029);
	}

	ctx.fillStyle = theme.ink;
	ctx.font = '650 28px "Archivo Variable", Arial, sans-serif';
	ctx.fillText('Olinda, Pernambuco', 72, 1216);
	ctx.fillStyle = theme.muted;
	ctx.font = '450 22px "Archivo Variable", Arial, sans-serif';
	ctx.fillText('Dados públicos. Em emergência, siga a Defesa Civil.', 72, 1260);
	ctx.textAlign = 'right';
	ctx.font = '600 22px "Archivo Variable", Arial, sans-serif';
	ctx.fillText('OLHONACHUVA', 1008, 1259);
	ctx.textAlign = 'left';

	return toFile(canvas, `olho-na-chuva-${area.id}.png`);
}
