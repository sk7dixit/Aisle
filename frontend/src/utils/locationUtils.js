/**
 * Calculates the Haversine distance between two points in meters.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

/**
 * Resolves a human-readable area name from Nominatim address parts with prioritized levels.
 * Priority: Neighborhood -> Suburb -> Sublocality -> Residential -> Hamlet -> Village -> Road -> City
 * @param {Object} address 
 * @returns {string} The prioritized area name
 */
export const resolveAreaName = (address) => {
    if (!address) return "Your Area";

    // Priority 1: Specific landmarks or places
    const landmark = address.amenity || address.place || address.landmark || address.industrial || address.commercial || address.retail;
    if (landmark) return landmark;

    // Priority 2: Neighborhoods and small areas
    return (
        address.neighbourhood ||
        address.suburb ||
        address.sublocality ||
        address.residential ||
        address.quarter ||
        address.hamlet ||
        address.village ||
        address.city_district ||
        address.district ||
        address.road || // Road as a fallback for intersections
        address.town ||
        address.city ||
        address.county ||
        address.state_district ||
        "Unknown Area"
    );
};

/**
 * Resolves a slightly more detailed location string for search fields.
 * Example: "Yogi Society, Waghodia Road"
 * @param {Object} address 
 * @returns {string}
 */
export const resolveDetailedLocation = (address) => {
    if (!address) return "";
    const primary = resolveAreaName(address);
    const secondary = address.city || address.town || address.village || address.municipality || address.county || address.state_district || "";

    if (primary === "Unknown Area") {
        return secondary || "Unknown Area";
    }

    if (primary && secondary && primary !== secondary) {
        return `${primary}, ${secondary}`;
    }
    return primary || secondary;
};
