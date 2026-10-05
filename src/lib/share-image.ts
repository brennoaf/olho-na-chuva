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

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string, raining = true) {
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
	ctx.closePath();
	ctx.stroke();
	if (raining) {
		for (const offset of [16, 31, 46]) {
			ctx.beginPath();
			ctx.moveTo(x + offset * scale, y + 41 * scale);
			ctx.lineTo(x + (offset - 3) * scale, y + 52 * scale);
			ctx.stroke();
		}
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
	canvas.height = 1080;
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

	const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
	background.addColorStop(0, theme.top);
	background.addColorStop(.7, theme.middle);
	background.addColorStop(1, theme.bottom);
	ctx.fillStyle = background;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'rgba(255,255,255,.2)';
	ctx.beginPath();
	ctx.moveTo(0, 20);
	ctx.bezierCurveTo(320, 180, 700, -30, 1080, 150);
	ctx.lineTo(1080, 0);
	ctx.lineTo(0, 0);
	ctx.fill();
	ctx.strokeStyle = 'rgba(255,255,255,.3)';
	ctx.lineWidth = 3;
	for (let index = 0; index < 4; index += 1) {
		ctx.beginPath();
		ctx.moveTo(660 + index * 68, 115);
		ctx.bezierCurveTo(770 + index * 45, 250, 760 + index * 58, 430, 950 + index * 62, 610);
		ctx.stroke();
	}
	ctx.fillStyle = 'rgba(255,255,255,.12)';
	ctx.beginPath();
	ctx.moveTo(0, 590);
	ctx.bezierCurveTo(300, 500, 590, 690, 1080, 520);
	ctx.lineTo(1080, 760);
	ctx.lineTo(0, 760);
	ctx.fill();

	ctx.textBaseline = 'top';
	cloud(ctx, 64, 55, .72, theme.ink);
	ctx.fillStyle = theme.ink;
	ctx.font = '650 29px "Archivo Variable", Arial, sans-serif';
	ctx.fillText('olho na chuva', 122, 67);
	ctx.textAlign = 'right';
	ctx.fillStyle = theme.muted;
	ctx.font = '550 21px "Archivo Variable", Arial, sans-serif';
	ctx.fillText(`${status.stale ? 'DADOS SALVOS' : 'ATUALIZADO'} ÀS ${formatHour(status.fetchedAt)}`, 1010, 72);
	ctx.textAlign = 'left';

	pin(ctx, 78, 151, theme.accent);
	ctx.fillStyle = theme.accent;
	ctx.font = '650 25px "Archivo Variable", Arial, sans-serif';
	ctx.fillText(area.name.toLocaleUpperCase('pt-BR'), 110, 140);

	ctx.fillStyle = theme.ink;
	ctx.font = '650 218px "Archivo Variable", Arial, sans-serif';
	const rainValue = station ? number(station.h1) : '?';
	ctx.fillText(rainValue, 62, 215);
	const rainWidth = ctx.measureText(rainValue).width;
	ctx.font = '600 52px "Archivo Variable", Arial, sans-serif';
	ctx.fillText('mm', 74 + rainWidth, 354);
	ctx.fillStyle = theme.muted;
	ctx.font = '600 22px "Archivo Variable", Arial, sans-serif';
	ctx.fillText('CHUVA NA ÚLTIMA HORA', 72, 450);
	ctx.font = '450 24px "Archivo Variable", Arial, sans-serif';
	ctx.fillText(station ? `leitura das ${formatHour(station.readAt)}` : 'medição indisponível', 72, 487);
	cloud(ctx, 762, 246, 3.15, 'rgba(255,255,255,.72)', Boolean(station?.h1 || assessment.risk > 0));

	ctx.fillStyle = theme.ink;
	const title = limited && assessment.risk === 0 ? 'Dados incompletos' : message.title;
	const titleEnd = wrapped(ctx, title, 70, 550, 900, 66, 68, 2);
	if (assessment.risk > 0 || limited) {
		ctx.fillStyle = theme.muted;
		ctx.font = '450 27px "Archivo Variable", Arial, sans-serif';
		for (const [index, line] of lines(ctx, message.instruction, 880).slice(0, 2).entries()) ctx.fillText(line, 72, titleEnd + 8 + index * 34);
	}

	ctx.fillStyle = theme.ink;
	ctx.beginPath();
	ctx.moveTo(0, 770);
	ctx.bezierCurveTo(300, 725, 735, 800, 1080, 748);
	ctx.lineTo(1080, 1080);
	ctx.lineTo(0, 1080);
	ctx.closePath();
	ctx.fill();

	ctx.fillStyle = 'rgba(255,255,255,.58)';
	ctx.font = '600 20px "Archivo Variable", Arial, sans-serif';
	ctx.fillText('PRÓXIMAS 12 HORAS', 72, 812);
	ctx.fillText(third.label.toLocaleUpperCase('pt-BR'), 570, 812);
	ctx.fillStyle = '#ffffff';
	ctx.font = '650 54px "Archivo Variable", Arial, sans-serif';
	ctx.fillText(forecastValue, 72, 850);
	ctx.fillText(third.value, 570, 850);
	ctx.fillStyle = 'rgba(255,255,255,.7)';
	ctx.font = '450 25px "Archivo Variable", Arial, sans-serif';
	ctx.fillText(forecastDetail, 72, 918);
	ctx.fillText(third.detail, 570, 918);
	ctx.strokeStyle = 'rgba(255,255,255,.2)';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(520, 808);
	ctx.lineTo(520, 946);
	ctx.stroke();

	ctx.fillStyle = 'rgba(255,255,255,.68)';
	ctx.font = '500 20px "Archivo Variable", Arial, sans-serif';
	ctx.fillText(assessment.risk >= 2 ? 'DEFESA CIVIL  0800 081 0060' : 'OLINDA, PERNAMBUCO', 72, 1018);
	ctx.textAlign = 'right';
	ctx.fillText('DADOS PÚBLICOS', 1008, 1018);
	ctx.textAlign = 'left';

	return toFile(canvas, `olho-na-chuva-${area.id}.png`);
}
