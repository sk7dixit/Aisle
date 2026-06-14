import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
    // 1. Initialize State from LocalStorage (Source of Truth)
    const [userLocation, setUserLocation] = useState(() => {
        try {
            const saved = localStorage.getItem("aisle_location");
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Error parsing stored location", e);
            localStorage.removeItem("aisle_location");
        }
        return null;
    });

    // Valid statuses: 'IDLE', 'DETECTING', 'READY', 'ERROR'
    const [status, setStatus] = useState(userLocation ? 'READY' : 'IDLE');
    const [isWarmingUp, setIsWarmingUp] = useState(false);
    const [error, setError] = useState(null);

    const isLocating = status === 'DETECTING';

    // 2. The ONLY way to update location (Explicit Call)
    const detectLocation = async () => {
        if (!navigator.geolocation) {
            setError("Geolocation not supported");
            setStatus('ERROR');
            return;
        }

        setStatus('DETECTING');
        setIsWarmingUp(true);
        setError(null);

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    try {
                        const result = await updateLocation(latitude, longitude);
                        setIsWarmingUp(false);
                        resolve(result);
                    } catch (err) {
                        setIsWarmingUp(false);
                        reject(err);
                    }
                },
                (err) => {
                    console.error("Geolocation error", err);
                    setError(err.message || "Permission denied.");
                    setStatus('ERROR');
                    setIsWarmingUp(false);
                    reject(err);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    };

    // Manual update or after detection
    const updateLocation = async (lat, lng, persist = true) => {
        setStatus('DETECTING');
        setError(null);

        try {
            // Reverse Geocode
            const response = await fetch(`/api/location/reverse?lat=${lat}&lng=${lng}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Failed to resolve area");

            const locationData = {
                lat,
                lng,
                city: data.city || "Unknown City",
                area: data.city || "Unknown Area", // Standardizing on city name for 'area' if not specific
                address: data.displayName || `${data.city || ""}, ${data.state || ""}`.trim().replace(/^,|,$/g, ''),
                country: data.country
            };

            if (persist) {
                localStorage.setItem("aisle_location", JSON.stringify(locationData));
            }

            setUserLocation(locationData);
            setStatus('READY');
            return locationData;

        } catch (err) {
            console.error("Geocoding failed", err);
            setError("Could not match location to a city.");
            setStatus('ERROR');

            // Fallback: Use coords even if city fails
            const fallbackData = {
                lat,
                lng,
                city: "Current Location",
                area: "GPS Coordinates",
                address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            };

            if (persist) {
                localStorage.setItem("aisle_location", JSON.stringify(fallbackData));
            }

            setUserLocation(fallbackData);
            setStatus('READY'); // Treat as ready even with fallback
            return fallbackData;
        }
    };

    const updateLocationByCity = (cityName) => {
        const locationData = {
            city: cityName,
            area: cityName,
            address: cityName,
            lat: null,
            lng: null
        };
        localStorage.setItem("aisle_location", JSON.stringify(locationData));
        setUserLocation(locationData);
        setStatus('READY');
        return locationData;
    };

    // 3. Clear Manual Override (Reset)
    const clearLocation = () => {
        localStorage.removeItem("aisle_location");
        setUserLocation(null);
        setStatus('IDLE');
    };

    return (
        <LocationContext.Provider value={{
            userLocation,
            status,
            isLocating,
            isWarmingUp,
            detectLocation,
            refreshLocation: detectLocation, // Alias for compatibility
            updateLocation,
            updateLocationByCity,
            clearLocation,
            error
        }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) throw new Error("useLocation must be used within LocationProvider");
    return context;
};
