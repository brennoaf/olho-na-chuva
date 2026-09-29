export type Point = { lat: number; lon: number };

export class LocationError extends Error {}

export function currentPosition(): Promise<Point> {
	return new Promise((resolve, reject) => {
		if (!('geolocation' in navigator)) {
			reject(new LocationError('Este celular não informa a localização. Escolha a sua área na lista.'));
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(position) => resolve({ lon: position.coords.longitude, lat: position.coords.latitude }),
			(error) => {
				const message =
					error.code === error.PERMISSION_DENIED
						? 'Você não permitiu usar a localização. Toque no cadeado do navegador para liberar, ou escolha a área na lista.'
						: error.code === error.TIMEOUT
							? 'O GPS demorou demais. Tente de novo perto de uma janela ou escolha a área na lista.'
							: 'Não conseguimos achar sua localização. Tente de novo ou escolha a área na lista.';
				reject(new LocationError(message));
			},
			{ enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
		);
	});
}
