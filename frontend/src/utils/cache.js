export function setCache(key, data) {
    localStorage.setItem(
        key,
        JSON.stringify({
            data,
            timestamp: Date.now()
        })
    );
}

export function getCache(key, ttlMs) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp > ttlMs) {
            localStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    } catch {
        localStorage.removeItem(key);
        return null;
    }
}

export function clearCacheByPrefix(prefix) {
    Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
        }
    });
}
