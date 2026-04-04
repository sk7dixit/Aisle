export function estimateWalkingTime(distanceKm) {
    const walkingSpeedKmph = 5;
    const timeHours = distanceKm / walkingSpeedKmph;
    const timeMinutes = Math.round(timeHours * 60);

    return timeMinutes;
}
