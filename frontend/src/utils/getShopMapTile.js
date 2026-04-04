function lon2tile(lon, zoom) {
    return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat, zoom) {
    return Math.floor(
        ((1 -
            Math.log(
                Math.tan((lat * Math.PI) / 180) +
                1 / Math.cos((lat * Math.PI) / 180)
            ) /
            Math.PI) /
            2) *
        Math.pow(2, zoom)
    );
}

export function getShopMapTile(lat, lng, zoom = 16) {
    if (!lat || !lng) return null;

    const x = lon2tile(lng, zoom);
    const y = lat2tile(lat, zoom);

    return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}
