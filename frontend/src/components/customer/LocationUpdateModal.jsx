import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaMapMarkerAlt, FaSearch, FaLocationArrow, FaTimes, FaSpinner, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import { useLocation } from '../../context/LocationContext';
import { getStaticMap } from '../../utils/staticMap';

const LocationUpdateModal = ({ onClose, onUpdate, initialLocation, initialRadius = 5 }) => {
    const { refreshLocation, userLocation, isLocating, isWarmingUp, error: contextError } = useLocation();
    const [mode, setMode] = useState('select'); // 'select' | 'manual' | 'refine'
    const [manualQuery, setManualQuery] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [radius, setRadius] = useState(initialRadius);
    const [tempCoords, setTempCoords] = useState(initialLocation || null);
    const [manualResults, setManualResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // Sync context error
    useEffect(() => {
        if (contextError) setErrorMsg(contextError);
    }, [contextError]);

    // Handle manual search with OSM
    useEffect(() => {
        if (mode === 'manual' && manualQuery.length > 2) {
            const delayDebounceFn = setTimeout(async () => {
                setSearching(true);
                try {
                    const response = await fetch(`/api/location/search?q=${manualQuery}`);
                    const data = await response.json();
                    setManualResults(data);
                } catch (error) {
                    console.error("Search failed:", error);
                } finally {
                    setSearching(false);
                }
            }, 500);

            return () => clearTimeout(delayDebounceFn);
        } else {
            setManualResults([]);
        }
    }, [manualQuery, mode]);

    const handleUseGPS = () => {
        setErrorMsg('');
        setMode('refine');
        refreshLocation(true);
    };

    // When GPS updates in context, sync it to tempCoords if we are waiting for it
    useEffect(() => {
        if (mode === 'refine' && userLocation && isWarmingUp) {
            setTempCoords({ lat: userLocation.lat, lng: userLocation.lng });
        }
    }, [userLocation, isWarmingUp, mode]);

    const handleConfirmRefinement = async () => {
        if (!tempCoords) return;

        try {
            const response = await fetch(`/api/location/reverse?lat=${tempCoords.lat}&lng=${tempCoords.lng}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Address not found");

            const finalLoc = {
                area: data.city || "Selected Location",
                city: data.city || "Nearby",
                lat: tempCoords.lat,
                lng: tempCoords.lng,
                isGpsSet: true,
                addressSource: 'osm',
                accuracy: 'pinpoint'
            };

            await onUpdate(finalLoc, radius);
            onClose();

        } catch (err) {
            console.error("Geocoding failed:", err);
            onUpdate({ lat: tempCoords.lat, lng: tempCoords.lng, area: 'Pinned Location', city: 'Nearby' }, radius);
            onClose();
        }
    };

    const handleSelectResult = (result) => {
        setTempCoords({ lat: result.lat, lng: result.lng });
        setMode('refine');
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        // The autocomplete listener handles the transition. 
        // This is just a fallback if they hit enter without selecting
        if (!tempCoords) {
            setErrorMsg("Please select a valid location from the list.");
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-[#181411]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <div className={`bg-white rounded-[2rem] w-full shadow-2xl relative overflow-hidden transition-all duration-300 ${mode === 'refine' ? 'max-w-2xl h-[85vh]' : 'max-w-sm'}`}>
                {/* ... existing location update content ... */}
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white relative z-10">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 leading-none mb-1">Set Shopping Area</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Targeting: {radius}km Radius</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <FaTimes className="text-slate-400" />
                    </button>
                </div>

                <div className="flex flex-col h-[calc(100%-80px)]">
                    {mode === 'refine' ? (
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 relative bg-slate-100 flex items-center justify-center overflow-hidden">
                                {tempCoords ? (
                                    <div className="relative w-full h-full">
                                        {tempCoords?.lat && tempCoords?.lng && (
                                            <img
                                                src={getStaticMap(tempCoords.lat, tempCoords.lng)}
                                                alt="Location Map"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = "none";
                                                }}
                                            />
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-lg animate-pulse"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <FaSpinner className="animate-spin text-xl" />
                                    </div>
                                )}

                                <div className="absolute top-4 left-4 z-10 space-y-2">
                                    {isWarmingUp && (
                                        <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-blue-50 flex items-center gap-3 animate-pulse">
                                            <FaSpinner className="animate-spin text-blue-600" />
                                            <div>
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Refining GPS...</p>
                                                <p className="text-[9px] font-bold text-slate-500">Wait for better accuracy</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                                    <p className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-bold shadow-2xl flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-blue-400" /> Previewing Pinned Location
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50/50 backdrop-blur-md border-t border-slate-100">
                                <button
                                    onClick={handleConfirmRefinement}
                                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                                >
                                    CONFIRM LOCATION <FaCheck />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {errorMsg && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-xs font-bold animate-shake">
                                    <FaExclamationTriangle className="mt-1" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Radius</label>
                                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black">{radius} km</span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="20" step="1"
                                    value={radius}
                                    onChange={(e) => setRadius(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>

                            {mode === 'select' ? (
                                <div className="space-y-3">
                                    <button
                                        onClick={handleUseGPS}
                                        disabled={isLocating}
                                        className="w-full flex items-center gap-4 p-5 rounded-3xl border-2 border-blue-50 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-200 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                                            <FaLocationArrow />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-black text-slate-900 group-hover:text-blue-700">Auto-Detect</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fast & Accurate</p>
                                        </div>
                                    </button>

                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                                        <span className="relative flex justify-center text-[10px] font-black text-slate-300 bg-white px-4 uppercase tracking-[0.3em]">OR</span>
                                    </div>

                                    <button
                                        onClick={() => setMode('manual')}
                                        className="w-full flex items-center gap-4 p-5 rounded-3xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0 group-hover:text-slate-600">
                                            <FaSearch />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-black text-slate-900">Manual Search</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OpenStreetMap</p>
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleManualSubmit} className="animate-fade-in-up">
                                    <div className="mb-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Area / Landmark</label>
                                        <div className="relative">
                                            <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                                            <input
                                                type="text"
                                                autoFocus
                                                autoComplete="off"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none font-bold text-slate-800"
                                                placeholder="Search area..."
                                                value={manualQuery}
                                                onChange={(e) => setManualQuery(e.target.value)}
                                            />
                                            {searching && (
                                                <FaSpinner className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto space-y-2 mb-6 scrollbar-hide">
                                        {manualResults.map((res, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleSelectResult(res)}
                                                className="w-full text-left p-4 rounded-xl border border-slate-50 hover:bg-blue-50 hover:border-blue-100 transition-all"
                                            >
                                                <p className="text-xs font-bold text-slate-800 line-clamp-2">{res.display_name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{res.city || 'Nearby'}</p>
                                            </button>
                                        ))}
                                        {manualQuery.length > 2 && manualResults.length === 0 && !searching && (
                                            <p className="text-center py-4 text-[10px] font-bold text-slate-400 italic">No areas found. Try a broader search.</p>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setMode('select')}
                                            className="flex-1 py-4 rounded-2xl border border-slate-100 text-slate-400 font-black text-xs hover:bg-slate-50 tracking-widest uppercase transition-all"
                                        >
                                            Back
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LocationUpdateModal;
