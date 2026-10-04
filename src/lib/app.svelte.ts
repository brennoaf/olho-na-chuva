import { fetchApacAlerts, fetchInmetAlerts, worst, type Alert } from './alerts';
import { AREAS, byId, type Area } from './areas';
import { fetchForecast, type Hour } from './forecast';
import { fetchStations, nearest, type Station } from './rain';
import { assess, type Assessment } from './risk';
import { fetchTides, type Extreme } from './tide';
import { HOUR, MINUTE } from './time';

export type Route = 'inicio' | 'lugar' | 'preparar' | 'historico' | 'sobre';
export type Toast = { text: string; tone: 'ok' | 'info' | 'erro'; id: number };
type Snapshot = { stations: Station[]; forecast: Hour[]; forecastAreaId?: string; tides: Extreme[]; alerts: Alert[]; fetchedAt: number; failed?: string[] };

const KEYS = { area: 'olho-na-chuva:area', data: 'olho-na-chuva:dados', reports: 'olho-na-chuva:relatos' };
const CITIES = ['Olinda', 'Paulista', 'Recife'];
const REFRESH = 10 * MINUTE;

function read<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

function write(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		return;
	}
}

const ROUTES: Route[] = ['inicio', 'lugar', 'preparar', 'historico', 'sobre'];
const parseRoute = (hash: string): Route => {
 const name = hash.replace(/^#\/?/, '').split('?')[0] as Route;
	return ROUTES.includes(name) ? name : 'inicio';
};

class AppState {
	route = $state<Route>('inicio');
	areaId = $state<string | null>(null);
	data = $state.raw<Snapshot | null>(null);
	loading = $state(false);
	failed = $state<string[]>([]);
	online = $state(true);
	now = $state(Date.now());
	toast = $state<Toast | null>(null);
	reports = $state<{ at: number; area: string; note: string }[]>([]);

	#timer: ReturnType<typeof setTimeout> | undefined;

	area = $derived<Area | null>(byId(this.areaId));
	forecast = $derived(this.data?.forecastAreaId === this.areaId ? this.data?.forecast ?? [] : []);
	activeAlerts = $derived((this.data?.alerts ?? []).filter(a => a.until === null || a.until > this.now));

	station = $derived.by(() => {
		const area = this.area;
		if (!area || !this.data) return null;
		return nearest(this.data.stations, area, this.now, area.gauges);
	});

	assessment = $derived.by<Assessment | null>(() => {
		const area = this.area;
		const data = this.data;
		if (!area || !data) return null;
		return assess({ hazard: area.hazard, now: this.now, station: this.station?.station ?? null, forecast: this.forecast, tides: data.tides, official: worst(this.activeAlerts) });
	});

	start(): () => void {
		this.areaId = read<string | null>(KEYS.area, null);
		this.data = read<Snapshot | null>(KEYS.data, null);
		this.failed = this.data?.failed ?? [];
		this.reports = read(KEYS.reports, []);
		this.online = navigator.onLine;
		this.route = parseRoute(location.hash);
		if (!this.areaId && this.route === 'inicio') this.route = 'lugar';

		const onHash = () => {
			if (location.hash === '#conteudo') return;
			this.route = parseRoute(location.hash);
			scrollTo({ top: 0 });
		};
		const tick = setInterval(() => (this.now = Date.now()), 30000);
		const loop = setInterval(() => void this.refresh(), REFRESH);
		const wake = () => {
			if (document.visibilityState !== 'visible') return;
			this.now = Date.now();
			if (!this.data || Date.now() - this.data.fetchedAt > 5 * MINUTE) void this.refresh();
		};
		const goOnline = () => {
			this.online = true;
			void this.refresh();
		};
		const goOffline = () => {
			this.online = false;
			this.notify('Sem internet. Mostrando os últimos dados salvos.', 'info');
		};
		addEventListener('hashchange', onHash);
		addEventListener('online', goOnline);
		addEventListener('offline', goOffline);
		document.addEventListener('visibilitychange', wake);
		void this.refresh();

		return () => {
			clearInterval(tick);
			clearInterval(loop);
			removeEventListener('hashchange', onHash);
			removeEventListener('online', goOnline);
			removeEventListener('offline', goOffline);
			document.removeEventListener('visibilitychange', wake);
		};
	}

	async refresh(manual = false): Promise<void> {
		if (this.loading) return;
		if (!navigator.onLine) {
			if (manual) this.notify('Sem internet agora. Mostrando os últimos dados salvos.', 'info');
			return;
		}
		this.loading = true;
		const area = this.area ?? AREAS[0]!;
		const now = Date.now();
		const previous = this.data;
		const signal = AbortSignal.timeout(12000);
		const [stations, forecast, tides, apac, inmet] = await Promise.allSettled([
			fetchStations(CITIES, signal),
			fetchForecast(area, signal),
			fetchTides(now - 12 * HOUR, now + 36 * HOUR, signal),
			fetchApacAlerts(signal),
			fetchInmetAlerts('2609600', signal)
		]);
		const failed: string[] = [];
		const pick = <T>(result: PromiseSettledResult<T>, fallback: T, label: string): T => {
			if (result.status === 'fulfilled') return result.value;
			failed.push(label);
			return fallback;
		};
		const savedAlerts = (source: Alert['source']) => (previous?.alerts ?? []).filter(a => a.source === source && (a.until === null || a.until > now));
		const alerts = [...pick(apac, savedAlerts('APAC'), 'avisos da APAC'), ...pick(inmet, savedAlerts('INMET'), 'avisos do INMET')];
		this.data = {
			stations: pick(stations, previous?.stations ?? [], 'pluviômetros'),
			forecast: pick(forecast, previous?.forecastAreaId === area.id ? previous.forecast : [], 'previsão'),
			forecastAreaId: area.id,
			tides: pick(tides, previous?.tides ?? [], 'maré'),
			alerts,
			fetchedAt: failed.length === 5 ? (previous?.fetchedAt ?? now) : now,
			failed
		};
		this.failed = failed;
		this.now = Date.now();
		this.loading = false;
		write(KEYS.data, this.data);
		if (this.areaId && this.areaId !== area.id) { void this.refresh(); return; }
		if (manual) this.notify(failed.length ? `Atualizado, mas sem ${failed.join(', ')}.` : 'Dados atualizados agora.', failed.length ? 'info' : 'ok');
	}

	chooseArea(id: string): void {
		const first = !this.areaId;
		this.areaId = id;
		write(KEYS.area, id);
		location.hash = '#/';
		this.notify(first ? 'Pronto! Agora é só abrir o app quando chover.' : `Mostrando ${byId(id)?.name}.`);
		void this.refresh();
	}

	notify(text: string, tone: Toast['tone'] = 'ok'): void {
		clearTimeout(this.#timer);
		this.toast = { text, tone, id: Date.now() };
		this.#timer = setTimeout(() => (this.toast = null), 4500);
	}

 addReport(note: string) {
  if (!this.area) return;
  const report = { at: Math.max(Date.now(), (this.reports[0]?.at ?? 0) + 1), area: this.area.id, note };
  this.reports = [report, ...this.reports].slice(0, 100);
  write(KEYS.reports, this.reports);
  return report;
 }

 removeReport(at: number): void {
  this.reports = this.reports.filter(report => report.at !== at);
  write(KEYS.reports, this.reports);
	}
}

export const app = new AppState();
