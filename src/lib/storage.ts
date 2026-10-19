import AsyncStorage from '@react-native-async-storage/async-storage';

// Small helpers to save and load any value on the phone (stored as JSON text).

export async function loadValue<T>(key: string, fallback: T): Promise<T> {
  try {
    const text = await AsyncStorage.getItem(key);
    return text === null ? fallback : (JSON.parse(text) as T);
  } catch {
    return fallback;
  }
}

export async function saveValue<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Saving failed (very rare). The app keeps working; the value just isn't remembered.
  }
}

export async function removeValue(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Nothing to do: the value stays, which is harmless.
  }
}

// Every key the app has saved (used for the backup).
export async function allKeys(): Promise<string[]> {
  try {
    return [...(await AsyncStorage.getAllKeys())];
  } catch {
    return [];
  }
}
