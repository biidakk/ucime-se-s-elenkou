// Speech recognition for the "speak" exercise: the shared interface.
// The web version is in recognition.web.ts (the browser's Web Speech API).
// On iOS/Android this is a stub for now, so the speak exercise is simply left out.
// For a native build, implement it with expo-speech-recognition (see MIGRATION.md).

export type RecognitionError = 'no-speech' | 'not-allowed' | 'unavailable' | 'other';

export type RecognitionHandlers = {
  onResult: (transcripts: string[]) => void; // the final result, best guesses first
  onError: (error: RecognitionError) => void;
  onEnd: () => void; // always called last
};

export function isRecognitionSupported(): boolean {
  return false;
}

// Listens once, in a locale like "de-DE". Returns a function that stops listening.
export function listenOnce(_locale: string, handlers: RecognitionHandlers): () => void {
  handlers.onError('unavailable');
  handlers.onEnd();
  return () => {};
}
