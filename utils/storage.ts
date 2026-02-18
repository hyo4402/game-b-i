
export const safeGet = <T>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved || saved === 'undefined' || saved === 'null') return fallback;
    return JSON.parse(saved);
  } catch (e) {
    console.warn(`Error parsing ${key}, resetting to fallback`, e);
    // If error, clear the corrupted data to prevent future crashes
    localStorage.removeItem(key);
    return fallback;
  }
};

export const safeSet = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
  }
};
