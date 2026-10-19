// Speech recognition in the browser (Web Speech API). On iPhone it needs Siri to be on and
// may not work in an app added to the Home Screen: the exercise then offers to skip.

import type { RecognitionError, RecognitionHandlers } from './recognition';

export type { RecognitionError, RecognitionHandlers } from './recognition';

// The browser's recognition class (not in the standard TypeScript types yet).
type BrowserRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onnomatch: (() => void) | null;
  onend: (() => void) | null;
};

function recognitionClass(): (new () => BrowserRecognition) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => BrowserRecognition) | undefined;
}

export function isRecognitionSupported(): boolean {
  return !!recognitionClass() && window.isSecureContext !== false;
}

function errorKind(error: string): RecognitionError {
  if (error === 'no-speech' || error === 'aborted') return 'no-speech';
  if (error === 'not-allowed') return 'not-allowed';
  if (error === 'service-not-allowed' || error === 'audio-capture' || error === 'network' || error === 'language-not-supported') {
    return 'unavailable';
  }
  return 'other';
}

export function listenOnce(locale: string, handlers: RecognitionHandlers): () => void {
  const Recognition = recognitionClass();
  if (!Recognition) {
    handlers.onError('unavailable');
    handlers.onEnd();
    return () => {};
  }
  let finished = false;
  let gotResult = false;
  const end = () => {
    if (finished) return;
    finished = true;
    handlers.onEnd();
  };

  const recognition = new Recognition();
  recognition.lang = locale;
  recognition.interimResults = false;
  recognition.maxAlternatives = 5;
  recognition.continuous = false;
  recognition.onresult = (event) => {
    const results = Array.from(event.results);
    const last = results[results.length - 1];
    if (!last) return;
    gotResult = true;
    handlers.onResult(Array.from(last).map((alt) => alt.transcript));
  };
  recognition.onnomatch = () => {
    gotResult = true;
    handlers.onResult([]);
  };
  recognition.onerror = (event) => handlers.onError(errorKind(event.error));
  recognition.onend = () => {
    if (!gotResult) handlers.onResult([]);
    end();
  };

  // Safari may fail to start right after text-to-speech has played: wait a moment.
  let started = false;
  const timer = setTimeout(() => {
    started = true;
    try {
      recognition.start();
    } catch {
      handlers.onError('unavailable');
      end();
    }
  }, 350);

  return () => {
    clearTimeout(timer);
    if (!started) {
      end();
      return;
    }
    try {
      recognition.stop();
    } catch {
      // already stopped
    }
  };
}
