// Speech recognition for the "speak" exercise and the chat microphone.
// Native (iOS/Android): expo-speech-recognition. The web version is in recognition.web.ts.
// On Android it uses the phone's speech service (usually the Google app); the same safety
// timers as on the web make sure listening can never get stuck.

import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { Platform } from 'react-native';

export type RecognitionError = 'no-speech' | 'not-allowed' | 'unavailable' | 'other';

export type RecognitionHandlers = {
  onResult: (transcripts: string[]) => void; // the final result, best guesses first
  onError: (error: RecognitionError) => void;
  onEnd: () => void; // always called last
  onPartial?: (transcript: string) => void; // what it has heard so far, while listening
  onVolume?: (level: number) => void; // how loud the microphone is, 0 (silence) to 1
};

const NO_AUDIO_MS = 6_000;
const MAX_LISTEN_MS = 15_000;
const END_GRACE_MS = 2_500;

export function isRecognitionSupported(): boolean {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
}

function errorKind(error: string): RecognitionError {
  if (error === 'no-speech' || error === 'aborted' || error === 'speech-timeout') return 'no-speech';
  if (error === 'not-allowed') return 'not-allowed';
  if (error === 'service-not-allowed' || error === 'audio-capture' || error === 'network' || error === 'language-not-supported') {
    return 'unavailable';
  }
  return 'other';
}

// Listens once, in a locale like "cs-CZ". Returns a function that stops listening.
export function listenOnce(locale: string, handlers: RecognitionHandlers): () => void {
  let finished = false;
  let gotResult = false;
  let heardAudio = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
  // iPhone: listening switches the sound to a recording mode in which everything plays very
  // quietly, and it stays so. Remember the sound settings and put them back at the end.
  let audioBefore: ReturnType<typeof ExpoSpeechRecognitionModule.getAudioSessionCategoryAndOptionsIOS> | null = null;
  if (Platform.OS === 'ios') {
    try {
      audioBefore = ExpoSpeechRecognitionModule.getAudioSessionCategoryAndOptionsIOS();
    } catch {
      // keep the defaults
    }
  }
  const subscriptions = [
    ExpoSpeechRecognitionModule.addListener('audiostart', () => {
      heardAudio = true;
    }),
    ExpoSpeechRecognitionModule.addListener('volumechange', (event) => {
      if (!finished) handlers.onVolume?.(Math.min(1, Math.max(0, event.value / 10)));
    }),
    ExpoSpeechRecognitionModule.addListener('result', (event) => {
      if (finished) return;
      if (!event.isFinal) {
        handlers.onPartial?.(event.results[0]?.transcript ?? '');
        return;
      }
      gotResult = true;
      handlers.onResult(event.results.map((r) => r.transcript));
    }),
    ExpoSpeechRecognitionModule.addListener('nomatch', () => {
      if (finished) return;
      gotResult = true;
      handlers.onResult([]);
    }),
    ExpoSpeechRecognitionModule.addListener('error', (event) => {
      if (!finished) handlers.onError(errorKind(event.error));
    }),
    ExpoSpeechRecognitionModule.addListener('end', () => {
      if (finished) return;
      if (!gotResult) handlers.onResult([]);
      end();
    }),
  ];

  function restoreAudio() {
    if (!audioBefore) return;
    try {
      ExpoSpeechRecognitionModule.setCategoryIOS(
        audioBefore.category === 'playAndRecord'
          ? { category: 'playback', categoryOptions: [], mode: 'default' }
          : audioBefore,
      );
    } catch {
      // the next start sets it again
    }
  }

  function end() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    subscriptions.forEach((s) => s.remove());
    restoreAudio();
    handlers.onEnd();
  }

  const giveUp = () => {
    if (finished) return;
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      // nothing to abort
    }
    handlers.onError('unavailable');
    end();
  };

  const stop = () => {
    if (finished) return;
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // already stopped
    }
    later(END_GRACE_MS, () => {
      if (!finished && !gotResult) handlers.onResult([]);
      end();
    });
  };

  (async () => {
    try {
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) return giveUp();
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (finished) return;
      if (!permission.granted) {
        handlers.onError('not-allowed');
        return end();
      }
      ExpoSpeechRecognitionModule.start({
        lang: locale,
        interimResults: !!handlers.onPartial,
        maxAlternatives: 5,
        continuous: false,
        volumeChangeEventOptions: { enabled: !!handlers.onVolume, intervalMillis: 100 },
      });
      later(NO_AUDIO_MS, () => {
        if (!heardAudio) giveUp();
      });
      later(MAX_LISTEN_MS, stop);
    } catch {
      giveUp();
    }
  })();

  return stop;
}
