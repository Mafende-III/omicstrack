class StorageEngine {
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      if (e?.name === 'QuotaExceededError' || e?.code === 22) {
        console.warn(`Storage quota exceeded for key "${key}" (${Math.round(JSON.stringify(value).length / 1024)}KB). Consider reducing file sizes.`);
      }
      return false;
    }
  }

  remove(key) {
    localStorage.removeItem(key);
  }

  clear() {
    localStorage.clear();
  }
}

export const storage = new StorageEngine();
