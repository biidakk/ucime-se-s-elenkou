// Speech recognition in the browser (Web Speech API).
// iPhone: Safari offers it (with Siri on), but apps added to the Home Screen report it as
// present and then never hear anything. So it counts as unsupported there, and the
// speaking exercises are hidden. Everywhere else, timers make sure listening can never get
// stuck: no sound or no end within a few seconds = stop and report "unavailable".

import { isApple, isInstalled } from './device';
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
  onaudiostart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onsoundend: (() => void) | null;
  onend: (() => void) | null;
};

const NO_AUDIO_MS = 6_000; // no microphone sound by then: the phone isn't really listening
const MAX_LISTEN_MS = 15_000; // stop listening after this long in any case
const END_GRACE_MS = 2_500; // after stop(), wait this long for the browser's "end"

function recognitionClass(): (new () => BrowserRecognition) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => BrowserRecognition) | undefined;
}

export function isRecognitionSupported(): boolean {
  if (isApple() && isInstalled()) return false; // iPhone Home Screen app: doesn't work
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
  let heardAudio = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
  const end = () => {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    handlers.onEnd();
  };

  const recognition = new Recognition();
  recognition.lang = locale;
  recognition.interimResults = !!handlers.onPartial;
  recognition.maxAlternatives = 5;
  recognition.continuous = false;
  recognition.onaudiostart = () => {
    heardAudio = true;
  };
  // The browser gives no loudness, only whether there is sound.
  recognition.onsoundstart = () => handlers.onVolume?.(0.6);
  recognition.onsoundend = () => handlers.onVolume?.(0);
  recognition.onresult = (event) => {
    if (finished) return;
    const results = Array.from(event.results);
    const last = results[results.length - 1];
    if (!last) return;
    if (!last.isFinal) {
      handlers.onPartial?.(last[0]?.transcript ?? '');
      return;
    }
    gotResult = true;
    handlers.onResult(Array.from(last).map((alt) => alt.transcript));
  };
  recognition.onnomatch = () => {
    if (finished) return;
    gotResult = true;
    handlers.onResult([]);
  };
  recognition.onerror = (event) => {
    if (!finished) handlers.onError(errorKind(event.error));
  };
  recognition.onend = () => {
    if (finished) return;
    if (!gotResult) handlers.onResult([]);
    end();
  };

  // Give up for good: the browser claims to listen but nothing happens.
  const giveUp = () => {
    if (finished) return;
    try {
      recognition.abort();
    } catch {
      // nothing to abort
    }
    handlers.onError('unavailable');
    end();
  };

  // Ask the browser to finish, and make sure we finish even if it never says so.
  const stop = () => {
    if (finished) return;
    try {
      recognition.stop();
    } catch {
      // already stopped
    }
    later(END_GRACE_MS, () => {
      if (!finished && !gotResult) handlers.onResult([]);
      end();
    });
  };

  // Safari may fail to start right after text-to-speech has played: wait a moment.
  let started = false;
  later(350, () => {
    started = true;
    try {
      recognition.start();
    } catch {
      giveUp();
      return;
    }
    later(NO_AUDIO_MS, () => {
      if (!heardAudio) giveUp();
    });
    later(MAX_LISTEN_MS, stop);
  });

  return () => {
    if (!started) {
      end();
      return;
    }
    stop();
  };
}
