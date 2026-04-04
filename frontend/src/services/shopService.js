import { getCache, setCache } from "../utils/cache";
import { SHOPS_CACHE_PREFIX, CACHE_TTL_MS } from "../constants/cacheKeys";

export async function getShopsByCity(city) {
    const cacheKey = `shops_${city}`;
    const cacheTimeout = 30 * 60 * 1000; // 30 minutes

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < cacheTimeout) {
            console.log(`Using cached shops for ${city}`);
            return data;
        }
        localStorage.removeItem(cacheKey);
    }

    console.log(`Fetching fresh shops for ${city}`);
    const res = await fetch(`/api/customer/shops?city=${city}`);
    const data = await res.json();

    localStorage.setItem(
        cacheKey,
        JSON.stringify({
            data,
            timestamp: Date.now()
        })
    );

    return data;
}

export async function fetchNearbyShops(lat, lng, radiusKm = 5) {
    const cacheKey = `${SHOPS_CACHE_PREFIX}_${lat}_${lng}_${radiusKm}`;

    const cached = getCache(cacheKey, CACHE_TTL_MS);
    if (cached) return cached;

    const res = await fetch(
        `/api/customer/shops-nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`
    );

    if (!res.ok) {
        throw new Error("Failed to fetch nearby shops");
    }

    const data = await res.json();
    setCache(cacheKey, data);
    return data;
}
