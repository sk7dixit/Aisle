export function filterByRadius(shops, radiusKm) {
    return shops.filter(
        (shop) => shop.distanceKm <= radiusKm
    );
}
