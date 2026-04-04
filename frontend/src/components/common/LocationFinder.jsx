import React, { useState } from 'react';
import { mappls } from 'mappls-web-maps';

const LocationFinder = () => {
    const [address, setAddress] = useState("Click button to find location");
    const [restAddress, setRestAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [restLoading, setRestLoading] = useState(false);

    // YOUR KEYS FROM THE DASHBOARD
    const mapKey = 'kvjthkpgzhirtselmlcujoazytvvqwhdyqls';

    const getExactLocationSDK = () => {
        if (!navigator.geolocation) {
            setAddress("Geolocation is not supported by your browser");
            return;
        }

        setLoading(true);
        setAddress("Initializing SDK...");

        try {
            // FIX: The mappls library for NPM requires instantiation
            const mapplsInstance = new mappls();
            console.log("Mappls Instance Created:", mapplsInstance);

            mapplsInstance.initialize(mapKey, () => {
                setAddress("Locating (SDK)...");

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;

                        const mapProps = { center: [lat, lon], zoom: 15 };

                        try {
                            // Use the instance to create the Map
                            const map = new mapplsInstance.Map('map-container', mapProps);
                            console.log("Map initialized:", map);

                            // Check where reverseGeocode is hiding
                            const reverseGeocodeFn = mapplsInstance.reverseGeocode || mappls.reverseGeocode;

                            if (typeof reverseGeocodeFn === 'function') {
                                reverseGeocodeFn({ lat, lng: lon }, function (data) {
                                    setLoading(false);
                                    if (data && data[0]) {
                                        console.log("SDK Raw Data:", data[0]);
                                        setAddress(JSON.stringify(data[0], null, 2));
                                    } else {
                                        setAddress("Address not found.");
                                    }
                                });
                            } else {
                                console.warn("reverseGeocode not found in SDK. Falling back to REST for address.");
                                // Fallback logic if SDK method is missing in this version
                                fetchAddressViaRestInternal(lat, lon, (addr) => {
                                    setAddress("SDK Map Initialized. Address (via REST Fallback):\n" + addr);
                                    setLoading(false);
                                });
                            }
                        } catch (err) {
                            console.error("SDK Map error:", err);
                            setAddress("SDK Error: " + err.message);
                            setLoading(false);
                        }
                    },
                    (error) => {
                        setLoading(false);
                        setAddress("Location Error: " + error.message);
                    }
                );
            });
        } catch (err) {
            console.error("SDK Initialization error:", err);
            setAddress("Init Error: " + err.message);
            setLoading(false);
        }
    };

    /**
     * Shared internal function to fetch address via REST
     */
    const fetchAddressViaRestInternal = async (lat, lng, callback) => {
        try {
            const response = await fetch(`/map-api/advancedmaps/v1/${mapKey}/rev_geocode?lat=${lat}&lng=${lng}`);
            if (!response.ok) throw new Error("API Request Failed");
            const data = await response.json();
            if (data && data.results && data.results[0]) {
                callback(JSON.stringify(data.results[0], null, 2));
            } else {
                callback("No results found.");
            }
        } catch (error) {
            callback("Error: " + error.message);
        }
    };

    /**
     * Direct REST API call using fetch
     * Uses the proxy defined in vite.config.js to handle CORS
     */
    const getAddressViaRest = async () => {
        if (!navigator.geolocation) {
            setRestAddress("Geolocation is not supported");
            return;
        }

        setRestLoading(true);
        setRestAddress("Fetching via REST...");

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude: lat, longitude: lng } = position.coords;

            try {
                // We use /map-api which is proxied to https://apis.mappls.com in vite.config.js
                const response = await fetch(`/map-api/advancedmaps/v1/${mapKey}/rev_geocode?lat=${lat}&lng=${lng}`);

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error("401 Unauthorized: API key restricted. Enable 'Reverse Geocoding' in Console and whitelist 'localhost'.");
                    }
                    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data && data.results && data.results[0]) {
                    console.log("REST Raw Data:", data.results[0]);
                    setRestAddress(JSON.stringify(data.results[0], null, 2));
                } else {
                    setRestAddress("No address found via REST.");
                }
            } catch (error) {
                console.error("REST Geocoding error:", error);
                setRestAddress("Error: " + error.message);
            } finally {
                setRestLoading(false);
            }
        }, (error) => {
            setRestLoading(false);
            setRestAddress("Cords Error: " + error.message);
        });
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', background: '#f9f9f9', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '800px', margin: '20px auto' }}>
            <h3 style={{ borderBottom: '2px solid #007BFF', paddingBottom: '10px' }}>Location Finder (Detective Mode)</h3>

            <div style={{ marginBottom: '25px' }}>
                <h4>Method 1: SDK (mappls-web-maps)</h4>
                <pre style={{
                    background: '#eee',
                    padding: '10px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                }}>
                    {address}
                </pre>
                <button
                    onClick={getExactLocationSDK}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        cursor: loading ? 'default' : 'pointer',
                        backgroundColor: '#007BFF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? "Fetching..." : "Get Raw Data (SDK)"}
                </button>
            </div>

            <div style={{ marginBottom: '25px' }}>
                <h4>Method 2: Direct REST API (with CORS Proxy)</h4>
                <pre style={{
                    background: '#eee',
                    padding: '10px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                }}>
                    {restAddress || "Click button to fetch via REST"}
                </pre>
                <button
                    onClick={getAddressViaRest}
                    disabled={restLoading}
                    style={{
                        padding: '10px 20px',
                        cursor: restLoading ? 'default' : 'pointer',
                        backgroundColor: '#28A745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        opacity: restLoading ? 0.7 : 1
                    }}
                >
                    {restLoading ? "Fetching..." : "Get Raw Data (REST)"}
                </button>
            </div>

            <div id="map-container" style={{ width: '100%', height: '200px', marginTop: '20px', borderRadius: '8px', border: '1px solid #ddd' }}></div>
            <p style={{ fontSize: '10px', color: '#999', marginTop: '5px' }}>* Map container required for SDK initialization</p>
        </div>
    );
};

export default LocationFinder;
