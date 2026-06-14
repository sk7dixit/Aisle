const express = require("express");
const axios = require("axios");
const router = express.Router();

/**
 * Reverse geocode latitude & longitude using OpenStreetMap (Nominatim)
 */
router.get("/reverse", async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ error: "lat and lng are required" });
        }

        const response = await axios.get(
            "https://nominatim.openstreetmap.org/reverse",
            {
                params: {
                    lat,
                    lon: lng,
                    format: "json"
                },
                headers: {
                    "User-Agent": "Aisle/1.0 (shoplens017@gmail.com)"
                }
            }
        );

        const address = response.data.address || {};

        const city =
            address.city ||
            address.town ||
            address.village ||
            address.county ||
            null;

        res.json({
            city,
            state: address.state || null,
            country: address.country || null,
            displayName: response.data.display_name || null,
            lat: Number(lat),
            lng: Number(lng)
        });

    } catch (error) {
        console.error("OSM ERROR:", error.response?.data || error.message);
        res.status(500).json({ error: "Reverse geocoding failed" });
    }
});

/**
 * Search location using OpenStreetMap (Nominatim)
 */
router.get("/search", async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: "query is required" });
        }

        const response = await axios.get(
            "https://nominatim.openstreetmap.org/search",
            {
                params: {
                    q,
                    format: "json",
                    addressdetails: 1,
                    limit: 5
                },
                headers: {
                    "User-Agent": "Aisle/1.0 (shoplens017@gmail.com)"
                }
            }
        );

        const results = response.data.map(item => ({
            display_name: item.display_name,
            lat: Number(item.lat),
            lng: Number(item.lon),
            city: item.address.city || item.address.town || item.address.village || item.address.county || null
        }));

        res.json(results);

    } catch (error) {
        console.error("OSM SEARCH ERROR:", error.response?.data || error.message);
        res.status(500).json({ error: "Search failed" });
    }
});

module.exports = router;
