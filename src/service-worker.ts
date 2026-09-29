/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, prerendered, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `olho-na-chuva-${version}`;
const DATA = 'olho-na-chuva-dados';
const ASSETS = [...build, ...files, ...prerendered].filter((path) => !path.startsWith('/data/'));

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE && key !== DATA).map((key) => caches.delete(key))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;

	if (url.pathname.startsWith('/data/')) {
		event.respondWith(
			(async () => {
				const cache = await caches.open(DATA);
				try {
					const response = await fetch(request, { cache: 'no-cache' });
					if (response.ok) void cache.put(url.pathname, response.clone());
					return response;
				} catch (error) {
					const hit = await cache.match(url.pathname);
					if (hit) return hit;
					throw error;
				}
			})()
		);
		return;
	}

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			if (ASSETS.includes(url.pathname)) {
				const hit = await cache.match(url.pathname);
				if (hit) return hit;
			}
			try {
				const response = await fetch(request);
				if (response.ok && response.type === 'basic') void cache.put(request, response.clone());
				return response;
			} catch (error) {
				const fallback = (await cache.match(request)) ?? (request.mode === 'navigate' ? await cache.match('/') : undefined);
				if (fallback) return fallback;
				throw error;
			}
		})()
	);
});
