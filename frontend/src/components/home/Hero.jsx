import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import InteractiveMap from './InteractiveMap';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';

const Hero = () => {
    const { userLocation, detectLocation, isLocating } = useLocation();
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleScanArea = async () => {
        try {
            await detectLocation();
        } catch (error) {
            console.error("Manual scan failed", error);
        }
    };

    // Derived location text
    const locationDisplay = isLocating
        ? 'Scanning your neighborhood...'
        : userLocation
            ? `Detected: ${userLocation.city || userLocation.area} (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`
            : '';

    return (
        <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 via-coral-50 to-amber-50">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-coral-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-teal-200">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold text-gray-700">LIVE INVENTORY NEARBY</span>
                        </div>

                        {/* Main Heading */}
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                                <span className="text-gray-900">Find</span>
                                <br />
                                <span className="bg-gradient-to-r from-teal-600 via-coral-500 to-amber-500 bg-clip-text text-transparent animate-gradient">
                                    Anything
                                </span>
                                <br />
                                <span className="text-gray-900">near you.</span>
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                                Skip the warehouse wait. See which local stores have exactly what you need, right now. Zero delivery markups.
                            </p>
                        </div>

                        {/* Search Bar / Location Display */}
                        <div className="space-y-6">
                            <div className="flex gap-3">
                                <Button
                                    className="flex-shrink-0 bg-white hover:bg-gray-50 text-teal-700 font-bold px-6 py-4 rounded-xl shadow-md hover:shadow-lg border border-teal-100 transition-all duration-300"
                                    onClick={handleScanArea}
                                    disabled={isLocating}
                                >
                                    <MapPin className={`w-5 h-5 mr-2 ${isLocating ? 'animate-spin' : ''}`} />
                                    {isLocating ? 'Scanning...' : 'Scan My Area'}
                                </Button>
                                <div className="relative flex-1">
                                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <Input
                                        type="text"
                                        value={locationDisplay}
                                        readOnly
                                        placeholder="Or scan to see where you are..."
                                        className="pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-white/50 focus:border-teal-500 shadow-sm text-base transition-all duration-300 cursor-default"
                                    />
                                </div>
                            </div>


                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-coral-500" />
                                Popular now: iPhone chargers, Yoga mats, Coffee beans
                            </p>
                        </div>

                        {/* Social Proof */}
                        <div className="flex items-center gap-6 pt-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="w-12 h-12 rounded-full border-3 border-white bg-gradient-to-br from-teal-400 to-coral-400 flex items-center justify-center text-white font-bold shadow-lg">
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">50,000+</p>
                                <p className="text-sm text-gray-600">neighbors discovering local shops</p>
                            </div>
                        </div>
                    </div>

                    {/* Right - Interactive Map */}
                    <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                        <InteractiveMap />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
