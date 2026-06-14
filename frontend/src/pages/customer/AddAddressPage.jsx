import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';
import { MapPin, Home, Briefcase, Navigation, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AddAddressPage = () => {
    const navigate = useNavigate();
    const { userLocation, setUserLocation, detectLocation } = useLocation(); // Context

    // Local state for form
    const [formData, setFormData] = useState({
        receiverName: '',
        phone: '',
        houseNo: '',
        street: '', // Area
        landmark: '',
        pincode: '',
        city: '',
        state: '',
        itemType: 'Home' // Home, Work, Other
    });

    const [loading, setLoading] = useState(false);

    // Prefill from LocationContext if available (GPS data)
    useEffect(() => {
        if (userLocation) {
            setFormData(prev => ({
                ...prev,
                city: userLocation.city || '',
                state: userLocation.country || '', // Mapping country/state roughly for now if needed, or adjust context
                street: userLocation.area || '',
                pincode: userLocation.pincode || ''
            }));
        }
    }, [userLocation]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem('token'); // Assuming standard token storage

        try {
            const response = await fetch('/api/customer/profile/address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    coordinates: {
                        lat: userLocation?.lat || 0,
                        lng: userLocation?.lng || 0
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save address');
            }

            toast.success('Address Saved Successfully!');

            // Update Context with full details
            setUserLocation({
                ...userLocation,
                area: formData.street,
                city: formData.city,
                address: `${formData.houseNo}, ${formData.street}, ${formData.city}`
            });

            // Redirect to Home or previous page
            setTimeout(() => navigate('/home'), 1000);

        } catch (error) {
            console.error('Save Address Error:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-transparent pt-2 pb-16">
            <div className="max-w-[1400px] w-[92%] mx-auto px-4 sm:px-6 lg:px-8">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-[#E07A5F] mb-4 transition-colors font-semibold text-sm"
                >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back
                </button>

                {/* Header Title */}
                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Add New Address</h1>
                    <p className="text-gray-500 mt-1.5 text-sm font-medium">Save an accurate address for better business and service discovery near you.</p>
                </div>

                {/* Grid Split Layout (30/70) */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
                    
                    {/* Left Column: Current Location (3 cols) */}
                    <div className="lg:col-span-3 space-y-4">
                        {userLocation ? (
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5 transition-all hover:shadow-md">
                                <div className="flex items-center gap-2 text-[#E07A5F]">
                                    <MapPin className="w-5 h-5 shrink-0" />
                                    <span className="font-bold text-gray-800 text-xs tracking-wider uppercase">Current Location</span>
                                </div>
                                <div className="space-y-1.5">
                                    {userLocation.area && (
                                        <p className="text-gray-950 font-bold text-base leading-snug">
                                            {userLocation.area}
                                        </p>
                                    )}
                                    <p className="text-gray-650 text-sm font-semibold">
                                        {userLocation.city || "Vadodara"}{userLocation.state || userLocation.country ? `, ${userLocation.state || userLocation.country}` : ''}
                                    </p>
                                    {userLocation.pincode && (
                                        <p className="text-gray-500 text-xs font-semibold tracking-wider">
                                            Pincode: {userLocation.pincode}
                                        </p>
                                    )}
                                </div>
                                <div className="pt-3 border-t border-gray-100 flex flex-col gap-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 w-max shadow-sm">
                                        ✓ Verified GPS Location
                                    </span>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                const detected = await detectLocation();
                                                if (detected) {
                                                    toast.success("Location refreshed successfully!");
                                                }
                                            } catch (err) {
                                                toast.error(err.message || "Failed to detect location.");
                                            }
                                        }}
                                        className="w-full text-center text-xs font-extrabold text-[#E07A5F] hover:text-[#d0694e] transition-colors py-2 border border-dashed border-[#E07A5F]/35 hover:border-[#E07A5F]/60 rounded-xl bg-orange-50/20 hover:bg-orange-50/50 cursor-pointer"
                                    >
                                        Change Location
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col items-center justify-center text-center text-gray-400 py-10">
                                <Navigation className="w-7 h-7 animate-spin text-[#E07A5F] mb-3" />
                                <span className="text-sm font-semibold">Reading GPS Location...</span>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Address Form (7 cols) */}
                    <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Input Layout */}
                            <div className="space-y-5">
                                {/* Row 1: Receiver Name & Phone Number */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Receiver's Name *</label>
                                        <input
                                            type="text"
                                            name="receiverName"
                                            required
                                            value={formData.receiverName}
                                            onChange={handleChange}
                                            placeholder="e.g. John Doe"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] outline-none transition-all text-gray-800 placeholder-gray-400 text-sm font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Phone Number *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="e.g. +91 98765 43210"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] outline-none transition-all text-gray-800 placeholder-gray-400 text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Row 2: House No & Area/Street */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Flat / House No / Building *</label>
                                        <input
                                            type="text"
                                            name="houseNo"
                                            required
                                            value={formData.houseNo}
                                            onChange={handleChange}
                                            placeholder="e.g. Flat 402, Galaxy Apartments"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] outline-none transition-all text-gray-800 placeholder-gray-400 text-sm font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Area / Colony / Street *</label>
                                        <input
                                            type="text"
                                            name="street"
                                            required
                                            value={formData.street}
                                            onChange={handleChange}
                                            placeholder="e.g. Sector 62, Near Metro Station"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] outline-none transition-all text-gray-800 placeholder-gray-400 text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Row 3: City & Pincode */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">City *</label>
                                        <input
                                            type="text"
                                            name="city"
                                            required
                                            value={formData.city}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] outline-none transition-all text-gray-800 bg-gray-50/50 cursor-not-allowed text-sm font-medium"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Pincode *</label>
                                        <input
                                            type="text"
                                            name="pincode"
                                            required
                                            value={formData.pincode}
                                            onChange={handleChange}
                                            placeholder="e.g. 390019"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] outline-none transition-all text-gray-800 placeholder-gray-400 text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Row 4: Landmark & Address Type */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Nearby Landmark (Optional)</label>
                                        <input
                                            type="text"
                                            name="landmark"
                                            value={formData.landmark}
                                            onChange={handleChange}
                                            placeholder="e.g. Behind Siva Temple"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] outline-none transition-all text-gray-800 placeholder-gray-400 text-sm font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Address Type</label>
                                        <div className="flex gap-2 h-[42px]">
                                            {[
                                                { type: 'Home', icon: <Home size={15} />, label: 'Home' },
                                                { type: 'Work', icon: <Briefcase size={15} />, label: 'Work' },
                                                { type: 'Other', icon: <MapPin size={15} />, label: 'Other' }
                                            ].map(({ type, icon, label }) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, itemType: type })}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border text-xs font-bold transition-all duration-300 transform active:scale-95 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                                                        formData.itemType === type
                                                            ? 'bg-[#E07A5F] text-white border-[#E07A5F] scale-[1.02] shadow-[#E07A5F]/20 shadow-lg'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#E07A5F]/40 hover:text-[#E07A5F]'
                                                    }`}
                                                >
                                                    {icon}
                                                    <span>{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Centered Save Action Button */}
                            <div className="flex justify-center pt-8 border-t border-gray-100 mt-8">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-[320px] bg-[#E07A5F] hover:bg-[#d0694e] text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:shadow-[#E07A5F]/20 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Save Address</span>
                                            <span className="transform transition-transform duration-300 group-hover:translate-x-1 font-bold">→</span>
                                        </>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddAddressPage;
