import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import {
    Map,
    MapMarker,
    MarkerContent,
    MarkerTooltip,
    MarkerLabel,
    MapControls,
    MapArc
} from '../ui/mapcn-map-marker';

const InteractiveMap = () => {
    const { userLocation } = useLocation();

    // Center of the map (Delhi, India as default, or the scanned geolocation coordinates)
    const userCoords = userLocation 
        ? [userLocation.lng, userLocation.lat]
        : [77.209, 28.6139]; // [lng, lat]
        
    const shopCoords = userLocation
        ? [userLocation.lng + 0.015, userLocation.lat + 0.011]
        : [77.230, 28.6304];
    
    const [hoveredArc, setHoveredArc] = useState(null);

    const arcData = [
        {
            id: 'user-to-shop',
            from: userCoords,
            to: shopCoords
        }
    ];

    return (
        <div className="relative w-full h-[500px] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900/10">
            {/* Ambient Background Glow behind the map container */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-teal-200/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-amber-200/20 rounded-full blur-[100px]" />
            </div>

            <div className="w-full h-full relative z-10">
                <Map
                    center={userCoords}
                    zoom={12.5}
                    pitch={45}
                    bearing={-10}
                    className="w-full h-full rounded-3xl"
                    theme="light" // Can auto-detect or force light theme for matching hero colors
                >
                    {/* Controls */}
                    <MapControls 
                        position="top-right" 
                        showZoom={true} 
                        showCompass={true} 
                        showLocate={true}
                    />

                    {/* Route Arc */}
                    <MapArc
                        data={arcData}
                        curvature={0.25}
                        paint={{
                            "line-color": "#ea580c",
                            "line-width": 4,
                            "line-opacity": 0.8
                        }}
                        hoverPaint={{
                            "line-color": "#0d9488",
                            "line-width": 6
                        }}
                        onHover={(e) => setHoveredArc(e ? e.arc : null)}
                    />

                    {/* User Location Marker */}
                    <MapMarker longitude={userCoords[0]} latitude={userCoords[1]}>
                        <MarkerContent>
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-10 h-10 bg-teal-500 rounded-full border-[3px] border-white shadow-lg flex items-center justify-center relative"
                            >
                                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                <div className="absolute inset-0 rounded-full border border-teal-400 animate-ping opacity-75"></div>
                            </motion.div>
                        </MarkerContent>
                        <MarkerTooltip className="bg-teal-600 text-white font-semibold">
                            {userLocation ? `${userLocation.city || userLocation.area}` : "You are here (Connaught Place)"}
                        </MarkerTooltip>
                        <MarkerLabel position="bottom" className="bg-white/90 backdrop-blur-md px-2 py-0.5 rounded shadow border border-gray-100 font-bold text-teal-800 text-[10px]">
                            You're here
                        </MarkerLabel>
                    </MapMarker>

                    {/* Shop Location Marker */}
                    <MapMarker longitude={shopCoords[0]} latitude={shopCoords[1]}>
                        <MarkerContent>
                            <div className="w-12 h-12 bg-orange-500 rounded-full border-[3px] border-white shadow-lg flex items-center justify-center relative hover:scale-110 transition-transform">
                                <ShoppingBag size={18} className="text-white" />
                            </div>
                        </MarkerContent>
                        <MarkerTooltip className="bg-[#1C140F] text-white font-semibold">
                            {userLocation ? `Aisle Shop near ${userLocation.city || 'you'}` : "Aisle Home Bakers & Handcrafted"}
                        </MarkerTooltip>
                        <MarkerLabel position="top" className="bg-[#1C140F]/95 text-white font-semibold px-2 py-1 rounded-xl shadow-xl flex items-center gap-1.5 text-[10px]">
                            <span>Shops near you</span>
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                        </MarkerLabel>
                    </MapMarker>
                </Map>
            </div>

            {/* Floating Stats Card (Glassmorphic) */}
            <div className="absolute bottom-4 left-4 bg-white/70 backdrop-blur-md p-3 pr-5 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3 z-20">
                <div className="flex -space-x-3">
                    <div className="w-8 h-8 rounded-full bg-teal-500 border-[2.5px] border-white flex items-center justify-center text-[9px] text-white font-bold shadow-sm">S1</div>
                    <div className="w-8 h-8 rounded-full bg-orange-500 border-[2.5px] border-white flex items-center justify-center text-[9px] text-white font-bold shadow-sm">S2</div>
                    <div className="w-8 h-8 rounded-full bg-yellow-400 border-[2.5px] border-white flex items-center justify-center text-[9px] text-white font-bold shadow-sm">S3</div>
                </div>
                <div>
                    <h4 className="font-extrabold text-gray-800 text-xs tracking-tight">8 Shops Live</h4>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest opacity-80">90+ Products</p>
                </div>
            </div>
        </div>
    );
};

export default InteractiveMap;
