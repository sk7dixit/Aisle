export function formatDistance(distanceMeters) {
    if (distanceMeters === undefined || distanceMeters === null) return "Near you";

    if (distanceMeters < 1000) {
        return `${Math.round(distanceMeters)} m away`;
    }
    return `${(distanceMeters / 1000).toFixed(1)} km away`;
}
