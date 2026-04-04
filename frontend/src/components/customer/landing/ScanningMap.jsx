import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaCircle } from 'react-icons/fa';

const ScanningMap = ({ cityName = "Vadodara", radius = 5 }) => {
    const [scanText, setScanText] = useState("Scanning shops around you...");
    const [foundCount, setFoundCount] = useState(0);

    // Dynamic copy rotation
    const loadingMessages = [
        "Scanning shops around you...",
        `Checking nearby pharmacies...`,
        `Looking within ${radius} km...`,
        "Finding open shops..."
    ];

    useEffect(() => {
        let index = 0;
        const textInterval = setInterval(() => {
            index = (index + 1) % loadingMessages.length;
            setScanText(loadingMessages[index]);
        }, 1200);

        // Simulate "Ghost" markers appearing
        const countInterval = setInterval(() => {
            setFoundCount(prev => prev + Math.floor(Math.random() * 2));
        }, 800);

        return () => {
            clearInterval(textInterval);
            clearInterval(countInterval);
        };
    }, [radius]);

    return (
        <div className="relative w-full h-[60vh] bg-gray-50 overflow-hidden flex flex-col items-center justify-center rounded-2xl border border-gray-100 shadow-inner">
            
            {/* Map Grid Background (Subtle) */}
            <div className="absolute inset-0 z-0 opacity-10" 
                style={{ 
                    backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', 
                    backgroundSize: '30px 30px' 
                }}>
            </div>

            {/* Radar Animation Center */}
            <div className="relative z-10 flex items-center justify-center mb-8">
                {/* Expanding Rings */}
                <div className="absolute w-24 h-24 bg-blue-500 rounded-full opacity-10 animate-ping duration-[2000ms]"></div>
                <div className="absolute w-48 h-48 bg-blue-400 rounded-full opacity-5 animate-ping duration-[3000ms] delay-500"></div>
                <div className="absolute w-64 h-64 bg-blue-300 rounded-full opacity-5 animate-ping duration-[4000ms] delay-1000"></div>

                {/* Users Location Pin */}
                <div className="relative z-20 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-blue-600 shadow-lg ring-4 ring-white animate-pulse"></div>
                    <div className="mt-2 px-3 py-1 bg-white/90 backdrop-blur shadow-sm rounded-full text-xs font-bold text-gray-700">
                        You ({cityName})
                    </div>
                </div>

                {/* Random "Ghost" Shop Markers - Animated Appearance */}
                <div className="absolute w-64 h-64 pointer-events-none">
                    <div className="absolute top-10 left-4 animate-fade-in-delayed">
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                    <div className="absolute bottom-12 right-8 animate-fade-in-delayed delay-700">
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                    <div className="absolute top-8 right-12 animate-fade-in-delayed delay-300">
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                     <div className="absolute bottom-6 left-16 animate-fade-in-delayed delay-500">
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                </div>
            </div>

            {/* Scanner Status Text */}
            <div className="relative z-20 text-center px-4">
                <h3 className="text-lg font-semibold text-gray-800 transition-all duration-300 ease-in-out">
                    {scanText}
                </h3>
                {/* Footer Trust Line */}
                <p className="text-xs text-gray-400 mt-2 font-medium">
                    Results are based on real-time shop updates.
                </p>
            </div>
        </div>
    );
};

export default ScanningMap;
