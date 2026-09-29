export function canSpeak(): boolean {
	return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string, onEnd: () => void): void {
	const synth = window.speechSynthesis;
	synth.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = 'pt-BR';
	utterance.rate = 0.92;
	const voice = synth.getVoices().find((v) => /pt[-_]BR/i.test(v.lang));
	if (voice) utterance.voice = voice;
	utterance.onend = onEnd;
	utterance.onerror = onEnd;
	synth.speak(utterance);
}

export function stopSpeaking(): void {
	if (canSpeak()) window.speechSynthesis.cancel();
}
