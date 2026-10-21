// One code base, two apps (see MIGRATION.md):
//   default          „Učíme se s Elenkou“: the web app (and a future iOS/Android app)
//   APP_VARIANT=ro   „Cehă pentru români“: the Android app that replaces the old app of that
//                    name. Same package id, EAS project (and so the same signing key) and icon,
//                    so it installs over it and keeps its saved progress (src/lib/legacyImport.ts).
// The rest of the configuration is in app.json.

const SPEECH_PERMISSIONS = {
  cs: {
    microphonePermission: 'Aplikace používá mikrofon, aby slyšela, jak vyslovujete.',
    speechRecognitionPermission: 'Aplikace rozpoznává, co říkáte, aby mohla zkontrolovat výslovnost.',
  },
  ro: {
    microphonePermission: 'Aplicația folosește microfonul ca să verifice cum pronunți în cehă.',
    speechRecognitionPermission: 'Aplicația recunoaște ce spui ca să verifice pronunția în cehă.',
  },
};

function withSpeechPermissions(plugins, lang) {
  return plugins.map((plugin) =>
    plugin === 'expo-speech-recognition'
      ? [
          'expo-speech-recognition',
          { ...SPEECH_PERMISSIONS[lang], androidSpeechServicePackages: ['com.google.android.googlequicksearchbox'] },
        ]
      : plugin,
  );
}

module.exports = ({ config }) => {
  if (process.env.APP_VARIANT !== 'ro') {
    return { ...config, plugins: withSpeechPermissions(config.plugins, 'cs') };
  }
  return {
    ...config,
    name: 'Cehă pentru români',
    slug: 'czech-ro-app',
    version: '2.0.1',
    scheme: 'cehaapp',
    icon: './assets/ro/icon.png',
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.biidakk.cehapentruromani',
      infoPlist: { ...config.ios?.infoPlist, CFBundleDisplayName: 'Cehă pentru români' },
    },
    android: {
      ...config.android,
      package: 'com.biidakk.cehapentruromani',
      versionCode: 4, // the old app's last build was 2; 2.0.0 was 3
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/ro/android-icon-foreground.png',
        backgroundImage: './assets/ro/android-icon-background.png',
        monochromeImage: './assets/ro/android-icon-monochrome.png',
      },
    },
    plugins: withSpeechPermissions(config.plugins, 'ro'),
    extra: {
      ...config.extra,
      defaultNative: 'ro', // start in Romanian, learning Czech
      eas: { projectId: 'cb022d93-4bed-4b8b-b48b-bade58edbe68' }, // the old app's EAS project
    },
  };
};
