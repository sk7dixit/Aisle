export function estimateWalkingTime(distanceMeters) {
    if (distanceMeters === undefined || distanceMeters === null) return null;

    const WALKING_SPEED_KMPH = 5; // standard walking speed
    const distanceKm = distanceMeters / 1000;

    const timeHours = distanceKm / WALKING_SPEED_KMPH;
    const timeMinutes = Math.max(1, Math.round(timeHours * 60));

    return timeMinutes;
}
