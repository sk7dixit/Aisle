import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FaMapMarkerAlt, FaTimes, FaEdit } from 'react-icons/fa';

const SellerShopLocationModal = ({ onClose, onSave, currentLocation, token }) => {
    const [address, setAddress] = useState(currentLocation?.address || '');
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // Save location immediately
                setSaving(true);
                try {
                    const res = await fetch('http://127.0.0.1:5000/api/seller/set-location', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            lat: latitude,
                            lng: longitude,
                            address: address
                        })
                    });

                    if (res.ok) {
                        alert('Shop location saved successfully! Your shop is now visible to nearby customers.');
                        onSave();
                        onClose();
                    } else {
                        const data = await res.json();
                        alert(data.message || 'Failed to save location');
                    }
                } catch (error) {
                    console.error('Save location error:', error);
                    alert('Failed to save location');
                } finally {
                    setSaving(false);
                    setDetecting(false);
                }
            },
            (error) => {
                alert('Unable to get your location. Please enable location access in your browser.');
                setDetecting(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const handleSaveAddress = async () => {
        if (!address.trim()) {
            alert('Please enter your shop address');
            return;
        }

        // For address-only updates, we still need GPS
        alert('Please use "Use Current Location" to set GPS coordinates along with your address.');
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
                {/* ... existing location picker content ... */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Set Shop Location</h3>
                        <p className="text-xs text-slate-500 mt-1">Confirm your address and enable GPS</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Shop Address
                            </label>
                            {!isEditingAddress && (
                                <button
                                    onClick={() => setIsEditingAddress(true)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                                >
                                    <FaEdit size={12} /> Change address
                                </button>
                            )}
                        </div>

                        {isEditingAddress ? (
                            <div className="space-y-2">
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    rows="3"
                                    className="w-full p-4 bg-slate-50 border-2 border-blue-300 rounded-xl font-medium text-slate-800 resize-none focus:outline-none focus:border-blue-500"
                                    placeholder="Street, Area, Landmark, City..."
                                />
                                <button
                                    onClick={() => setIsEditingAddress(false)}
                                    className="text-xs text-slate-500 hover:text-slate-700"
                                >
                                    Done editing
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <FaMapMarkerAlt className="text-slate-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">
                                            {address || 'No address set'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {address ? 'This address was provided during signup.' : 'Please add your shop address.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleUseCurrentLocation}
                            disabled={detecting || saving || !address.trim()}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl font-bold text-base hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            <FaMapMarkerAlt size={20} />
                            {detecting || saving ? 'Setting Location...' : 'Use Current Location'}
                        </button>
                        <p className="text-xs text-center text-slate-500 mt-3">
                            📍 This will use your device's GPS to set your shop's exact location
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                        <p className="text-xs text-blue-900 font-medium">
                            💡 <strong>How it works:</strong> We'll use your current GPS location to help customers find your shop. Make sure you're at your shop when you click the button above.
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SellerShopLocationModal;
